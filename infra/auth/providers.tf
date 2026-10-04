terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
  # Estado local, como infra/backend. El estado contiene el secreto de cliente de Google.
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "cuncho"
      Component   = "auth"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}
