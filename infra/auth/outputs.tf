output "google_redirect_uri" {
  description = "URI de redirección autorizada que hay que registrar en el cliente OAuth de Google."
  value       = "https://${local.domain_prefix}.auth.${var.aws_region}.amazoncognito.com/oauth2/idpresponse"
}

output "cognito_domain" {
  description = "VITE_COGNITO_DOMAIN (frontend)."
  value       = "${local.domain_prefix}.auth.${var.aws_region}.amazoncognito.com"
}

output "app_client_id" {
  description = "VITE_COGNITO_CLIENT_ID (frontend) y COGNITO_APP_CLIENT_ID (API)."
  value       = aws_cognito_user_pool_client.web.id
}

output "user_pool_id" {
  description = "COGNITO_USER_POOL_ID (API)."
  value       = aws_cognito_user_pool.main.id
}
