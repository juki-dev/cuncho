terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Estado: puede empezar local (sin este bloque). Cuando quieras compartirlo o no
  # depender de tu máquina, crea a mano un bucket S3 versionado y descomenta:
  #
  # backend "s3" {
  #   bucket       = "<bucket-de-estado>"
  #   key          = "cuncho/frontend/terraform.tfstate"
  #   region       = "us-east-1"
  #   encrypt      = true
  #   use_lockfile = true # bloqueo nativo en S3 (Terraform >= 1.10), sin DynamoDB
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "cuncho"
      Component   = "frontend"
      Environment = var.github_environment
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront solo acepta certificados ACM de us-east-1, sea cual sea la región del bucket.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "cuncho"
      Component   = "frontend"
      Environment = var.github_environment
      ManagedBy   = "terraform"
    }
  }
}
