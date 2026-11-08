package pe.redvecinal.shared.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.concurrent.TimeUnit;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Caché en memoria (RNF-06): perfil de seguridad por token, catálogos y contactos.
 * Si se despliegan varias instancias, considerar Redis.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String PERFIL_SEGURIDAD = "perfilSeguridad";
    public static final String CATEGORIAS = "categorias";
    public static final String CONTACTOS = "contactosSoporte";

    @Bean
    CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(PERFIL_SEGURIDAD, CATEGORIAS, CONTACTOS);
        manager.setCaffeine(Caffeine.newBuilder().maximumSize(10_000).expireAfterWrite(5, TimeUnit.MINUTES));
        return manager;
    }
}
