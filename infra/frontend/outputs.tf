output "bucket_name" {
  description = "Va a la variable S3_BUCKET del environment de GitHub."
  value       = aws_s3_bucket.site.bucket
}

output "distribution_id" {
  description = "Va a la variable CF_DISTRIBUTION_ID del environment de GitHub."
  value       = aws_cloudfront_distribution.site.id
}

output "deploy_role_arn" {
  description = "Va a la variable AWS_ROLE_ARN del environment de GitHub."
  value       = aws_iam_role.deploy.arn
}

output "aws_region" {
  description = "Va a la variable AWS_REGION del environment de GitHub."
  value       = var.aws_region
}

output "site_url" {
  value = "https://${local.fqdn}"
}
