terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Estado local al inicio. Para compartirlo, crea a mano un bucket S3 versionado y descomenta:
  #
  # backend "s3" {
  #   bucket       = "<bucket-de-estado>"
  #   key          = "cuncho/backend/terraform.tfstate"
  #   region       = "us-east-1"
  #   encrypt      = true
  #   use_lockfile = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "cuncho"
      Component   = "backend"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}
