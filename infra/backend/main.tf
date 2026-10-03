data "aws_caller_identity" "current" {}

data "aws_route53_zone" "root" {
  name         = var.root_domain
  private_zone = false
}

locals {
  availability_zone = "${var.aws_region}${var.availability_zone_suffix}"
  api_fqdn          = "${var.api_subdomain}.${var.root_domain}"
  instance_name     = "cuncho-api"

  # El mismo script sirve para el primer arranque (launch script) y para repetirlo a mano.
  user_data = join("\n", [
    "#!/usr/bin/env bash",
    "export DEPLOY_PUBKEY='${trimspace(var.deploy_ssh_public_key)}'",
    file("${path.module}/../../deploy/scripts/bootstrap-server.sh"),
  ])
}

# --- Servidor ----------------------------------------------------------------
resource "aws_lightsail_instance" "api" {
  name              = local.instance_name
  availability_zone = local.availability_zone
  blueprint_id      = "ubuntu_24_04"
  bundle_id         = var.instance_bundle_id
  key_pair_name     = var.lightsail_key_pair_name
  user_data         = local.user_data

  # Cambiar bundle_id destruye y recrea la instancia (Lightsail no redimensiona en sitio).
  # user_data también fuerza reemplazo: se ignora para que editar el script de arranque
  # no tumbe el servidor; la instancia nueva (por cambio de plan) usa la versión vigente.
  lifecycle {
    ignore_changes = [user_data, key_pair_name]
  }
}

# --- Datos persistentes -------------------------------------------------------
# Todo lo que no se puede perder vive aquí, montado en /opt/cuncho: Postgres,
# certificados de Caddy, .env, claves de host SSH y las etiquetas de versión.
resource "aws_lightsail_disk" "data" {
  name              = "cuncho-data"
  size_in_gb        = var.data_disk_size_gb
  availability_zone = local.availability_zone

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_lightsail_disk_attachment" "data" {
  disk_name     = aws_lightsail_disk.data.name
  instance_name = aws_lightsail_instance.api.name
  disk_path     = "/dev/xvdf"
}

# --- Red ---------------------------------------------------------------------
resource "aws_lightsail_static_ip" "api" {
  name = "cuncho-api-ip"
}

resource "aws_lightsail_static_ip_attachment" "api" {
  static_ip_name = aws_lightsail_static_ip.api.name
  instance_name  = aws_lightsail_instance.api.name
}

# Solo 22, 80 y 443. 5432 y 3000 nunca se publican.
resource "aws_lightsail_instance_public_ports" "api" {
  instance_name = aws_lightsail_instance.api.name

  port_info {
    protocol  = "tcp"
    from_port = 22
    to_port   = 22
  }
  port_info {
    protocol  = "tcp"
    from_port = 80
    to_port   = 80
  }
  port_info {
    protocol  = "tcp"
    from_port = 443
    to_port   = 443
  }
}

resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.root.zone_id
  name    = local.api_fqdn
  type    = "A"
  ttl     = 300
  records = [aws_lightsail_static_ip.api.ip_address]
}
