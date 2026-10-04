data "aws_caller_identity" "current" {}

locals {
  domain_prefix = coalesce(var.domain_prefix, "cuncho-${data.aws_caller_identity.current.account_id}")
}

# El pool solo sirve de intermediario para Google: no hay registro propio con contraseña
# (la API de Cuncho tiene su propio registro). Los usuarios llegan ya federados.
resource "aws_cognito_user_pool" "main" {
  name                     = "cuncho"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  deletion_protection      = "ACTIVE"

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
      min_length = 5
      max_length = 254
    }
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = local.domain_prefix
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "openid email profile"
  }

  # email_verified es imprescindible: la API solo acepta cuentas con el correo verificado.
  # Sin este mapeo Cognito lo deja en false y el ID token se rechaza (401 en /auth/cognito).
  attribute_mapping = {
    email          = "email"
    email_verified = "email_verified"
    name           = "name"
    username       = "sub"
  }
}

# Cliente público (SPA): sin secreto, código de autorización con PKCE.
resource "aws_cognito_user_pool_client" "web" {
  name         = "cuncho-web"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = [aws_cognito_identity_provider.google.provider_name]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true

  # El frontend solo usa el ID token una vez, para canjearlo por los tokens de la API.
  id_token_validity      = 60
  access_token_validity  = 60
  refresh_token_validity = 1
  token_validity_units {
    id_token      = "minutes"
    access_token  = "minutes"
    refresh_token = "days"
  }
}
