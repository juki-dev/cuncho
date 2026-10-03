# Infraestructura del backend (Terraform)

Crea en AWS: instancia Lightsail (Ubuntu 24.04), disco de datos persistente, IP estática, puertos 22/80/443, registro A en Route 53 y el bucket S3 de backups con su usuario IAM de solo escritura. Operación diaria: [`deploy/README.md`](../../deploy/README.md).

```bash
cp terraform.tfvars.example terraform.tfvars   # ajusta deploy_ssh_public_key
terraform init && terraform plan && terraform apply
```

- **Plan del servidor**: `instance_bundle_id` (por defecto `micro_3_0`, 1 GB). Confirma los IDs vigentes y precios con `aws lightsail get-bundles --region us-east-1`.
- **Escalar**: cambiar `instance_bundle_id` reemplaza la instancia; el disco `cuncho-data` (con `prevent_destroy`) y la IP se reasignan. Pasos completos en `deploy/README.md`.
- El script de arranque (`deploy/scripts/bootstrap-server.sh`) va como `user_data`; editarlo **no** reemplaza la instancia (`ignore_changes`), solo lo usan las instancias nuevas.
- Los discos de Lightsail se pueden ampliar pero no reducir; la zona de disponibilidad del disco y la instancia debe coincidir.
- Estado local por ahora (ver comentario en `providers.tf` para pasarlo a S3). `terraform.tfvars` y `*.tfstate` están ignorados por git; el estado contiene la clave secreta de backup.
