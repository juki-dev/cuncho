variable "aws_region" {
  description = "Región de Lightsail, S3 y Route 53 (la zona de Route 53 es global)."
  type        = string
  default     = "us-east-1"
}

variable "availability_zone_suffix" {
  description = "Sufijo de la zona de disponibilidad. La instancia y el disco de datos deben estar en la misma."
  type        = string
  default     = "a"
}

variable "root_domain" {
  description = "Dominio raíz con zona alojada pública en Route 53 (misma cuenta)."
  type        = string
  default     = "jukidev.com"
}

variable "api_subdomain" {
  description = "La API queda en <api_subdomain>.<root_domain>."
  type        = string
  default     = "cuncho-api"
}

# --- Tamaño del servidor: ESCALADO VERTICAL ---------------------------------
# Cambiar este valor y hacer `terraform apply` reemplaza la instancia por otra
# del tamaño nuevo. Los datos (Postgres, certificados, .env) viven en el disco
# de datos y la IP estática se reasigna sola, así que no se pierde nada; solo
# hay unos minutos de corte. Ver infra/backend/README.md.
variable "instance_bundle_id" {
  description = "Plan de Lightsail. Con Linux/IPv4: nano_3_0 (512 MB), micro_3_0 (1 GB), small_3_0 (2 GB), medium_3_0 (4 GB). Confirma los IDs vigentes con `aws lightsail get-bundles`."
  type        = string
  default     = "micro_3_0"
}

variable "data_disk_size_gb" {
  description = "Tamaño del disco de datos persistente. Los discos de Lightsail se pueden ampliar pero no reducir."
  type        = number
  default     = 20
}

variable "deploy_ssh_public_key" {
  description = "Llave pública SSH del usuario `deploy` (la privada va en el secreto SSH_PRIVATE_KEY de GitHub)."
  type        = string
}

variable "lightsail_key_pair_name" {
  description = "Par de llaves de Lightsail para el usuario administrador `ubuntu`. null = la llave por defecto de la región."
  type        = string
  default     = null
}

variable "backup_retention_days" {
  description = "Días que se conservan los dumps en S3."
  type        = number
  default     = 30
}

variable "backup_bucket_name" {
  description = "Nombre del bucket de backups. null = cuncho-backups-<id de cuenta>."
  type        = string
  default     = null
}
