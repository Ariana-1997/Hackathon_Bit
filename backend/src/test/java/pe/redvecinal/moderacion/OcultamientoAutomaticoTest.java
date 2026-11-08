package pe.redvecinal.moderacion;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pe.redvecinal.notificaciones.NotificacionService;
import pe.redvecinal.notificaciones.TipoNotificacion;
import pe.redvecinal.publicaciones.EstadoPublicacion;
import pe.redvecinal.publicaciones.Publicacion;
import pe.redvecinal.publicaciones.PublicacionService;
import pe.redvecinal.shared.config.AppProperties;
import pe.redvecinal.shared.historial.HistorialService;

class OcultamientoAutomaticoTest {

    private final DenunciaRepository denuncias = mock(DenunciaRepository.class);
    private final PublicacionService publicacionService = mock(PublicacionService.class);
    private final NotificacionService notificaciones = mock(NotificacionService.class);
    private final HistorialService historial = mock(HistorialService.class);

    private OcultamientoAutomatico regla;
    private Publicacion publicacion;
    private final UUID autor = UUID.randomUUID();
    private final UUID publicacionId = UUID.randomUUID();

    @BeforeEach
    void preparar() {
        AppProperties props = new AppProperties(null, null, null, null, new AppProperties.Moderacion(3));
        regla = new OcultamientoAutomatico(denuncias, publicacionService, notificaciones, historial, props);
        publicacion = mock(Publicacion.class);
        when(publicacion.getId()).thenReturn(publicacionId);
        when(publicacion.getAutorId()).thenReturn(autor);
        when(publicacion.getEstado()).thenReturn(EstadoPublicacion.ACTIVA);
    }

    private List<Denuncia> pendientes(int n) {
        return Stream.generate(Denuncia::new).limit(n).toList();
    }

    @Test
    void conMenosDelUmbralNoOculta() {
        when(denuncias.findByPublicacionIdAndEstado(publicacion.getId(), EstadoDenuncia.PENDIENTE)).thenReturn(pendientes(2));

        regla.evaluar(publicacion);

        verify(publicacionService, never()).cambiarEstado(any(), any(), any(), any());
        verifyNoInteractions(notificaciones);
    }

    @Test
    void alLlegarAlUmbralOcultaResuelveLasDenunciasYAvisaAlAutor() {
        List<Denuncia> lista = pendientes(3);
        when(denuncias.findByPublicacionIdAndEstado(publicacion.getId(), EstadoDenuncia.PENDIENTE)).thenReturn(lista);

        regla.evaluar(publicacion);

        verify(publicacionService).cambiarEstado(eq(publicacion), eq(EstadoPublicacion.MODERADA), isNull(), any());
        assertThat(lista).allSatisfy(d -> {
            assertThat(d.getEstado()).isEqualTo(EstadoDenuncia.RESUELTA);
            assertThat(d.getAccion()).isEqualTo(AccionModeracion.OCULTAR);
            assertThat(d.getJustificacion()).hasSizeGreaterThanOrEqualTo(10);   // ck_denuncia_resolucion
            assertThat(d.getResueltaEn()).isNotNull();
        });
        verify(notificaciones).notificar(eq(autor), eq(TipoNotificacion.MODERACION), any(), any(), eq("PUBLICACION"),
                eq(publicacionId));
    }

    @Test
    void unaPublicacionYaModeradaNoSeVuelveAProcesar() {
        when(publicacion.getEstado()).thenReturn(EstadoPublicacion.MODERADA);
        when(denuncias.findByPublicacionIdAndEstado(publicacion.getId(), EstadoDenuncia.PENDIENTE)).thenReturn(pendientes(4));

        regla.evaluar(publicacion);

        verify(publicacionService, never()).cambiarEstado(any(), any(), any(), any());
    }
}
