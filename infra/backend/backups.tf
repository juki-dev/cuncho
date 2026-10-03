locals {
  backup_bucket = coalesce(var.backup_bucket_name, "cuncho-backups-${data.aws_caller_identity.current.account_id}")
}

resource "aws_s3_bucket" "backups" {
  bucket = local.backup_bucket
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket                  = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "expirar-dumps"
    status = "Enabled"
    filter {}
    expiration {
      days = var.backup_retention_days
    }
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

# Lightsail no tiene identidad federada con AWS: es el único caso de claves de larga
# duración. El usuario solo puede ESCRIBIR en este bucket (no leer, no borrar).
resource "aws_iam_user" "backup_writer" {
  name = "cuncho-backup-writer"
}

data "aws_iam_policy_document" "backup_writer" {
  statement {
    actions   = ["s3:PutObject", "s3:AbortMultipartUpload"]
    resources = ["${aws_s3_bucket.backups.arn}/*"]
  }
}

resource "aws_iam_user_policy" "backup_writer" {
  name   = "escribir-backups"
  user   = aws_iam_user.backup_writer.name
  policy = data.aws_iam_policy_document.backup_writer.json
}

resource "aws_iam_access_key" "backup_writer" {
  user = aws_iam_user.backup_writer.name
}
