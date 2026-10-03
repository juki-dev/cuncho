output "api_url" {
  value = "https://${local.api_fqdn}"
}

output "static_ip" {
  description = "IP pública del servidor (registro A ya creado en Route 53)."
  value       = aws_lightsail_static_ip.api.ip_address
}

output "instance_bundle_id" {
  value = aws_lightsail_instance.api.bundle_id
}

output "backup_bucket" {
  value = aws_s3_bucket.backups.bucket
}

output "backup_access_key_id" {
  description = "Va en /opt/cuncho/.env como BACKUP_AWS_ACCESS_KEY_ID."
  value       = aws_iam_access_key.backup_writer.id
}

output "backup_secret_access_key" {
  description = "Va en /opt/cuncho/.env como BACKUP_AWS_SECRET_ACCESS_KEY. `terraform output -raw backup_secret_access_key`."
  value       = aws_iam_access_key.backup_writer.secret
  sensitive   = true
}
