package pe.redvecinal.shared.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Documentación de endpoints con OpenAPI/Swagger (RNF-48). UI en /swagger-ui.html */
@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI openApi() {
        String esquema = "bearer-supabase";
        return new OpenAPI()
                .info(new Info().title("RedVecinal API").version("v1")
                        .description("Economía local, cadena de favores y coordinación de emergencias entre vecinos."))
                .addSecurityItem(new SecurityRequirement().addList(esquema))
                .components(new Components().addSecuritySchemes(esquema,
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }
}
