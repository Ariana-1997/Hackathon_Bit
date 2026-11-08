package pe.redvecinal.integracion;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import pe.redvecinal.catalogo.AmbitoCategoria;
import pe.redvecinal.catalogo.CatalogoService;
import pe.redvecinal.catalogo.CategoriaCache;

/**
 * Prueba de integración (RNF-47): levanta PostGIS en Docker, aplica V1__bd_v2_inicial.sql con Flyway
 * y verifica que el mapeo JPA (enums nombrados, geography) lee el catálogo. Requiere Docker.
 */
@Testcontainers
@SpringBootTest
class BaseDatosIntegracionTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(
            DockerImageName.parse("postgis/postgis:16-3.4").asCompatibleSubstituteFor("postgres"))
            .withInitScript("db/supabase-stub.sql");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", postgres::getJdbcUrl);
        r.add("spring.datasource.username", postgres::getUsername);
        r.add("spring.datasource.password", postgres::getPassword);
        r.add("app.supabase.url", () -> "http://localhost:54321");
        r.add("app.supabase.anon-key", () -> "test");
        r.add("app.supabase.service-role-key", () -> "test");
        r.add("app.supabase.jwt-secret", () -> "secreto-de-pruebas-de-al-menos-32-caracteres");
    }

    @Autowired
    CategoriaCache categorias;

    @Autowired
    CatalogoService catalogo;

    @Test
    void flywayAplicaElEsquemaYElCatalogoSeLee() {
        Map<Integer, CategoriaCache.CategoriaInfo> todas = categorias.porId();
        assertThat(todas).isNotEmpty();
        assertThat(catalogo.arbol(AmbitoCategoria.ECONOMIA)).anySatisfy(n -> assertThat(n.hijos()).isNotEmpty());
    }
}
