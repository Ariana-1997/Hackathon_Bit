package pe.redvecinal.shared.historial;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Registra cada cambio de estado dentro de la MISMA transacción que el cambio (RNF-08, RNF-27). */
@Service
@RequiredArgsConstructor
public class HistorialService {

    private final HistorialEstadoRepository repository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(EntidadHistorial tipo, UUID entidadId, Enum<?> anterior, Enum<?> nuevo, UUID actorId, String motivo) {
        repository.save(new HistorialEstado(tipo, entidadId, anterior == null ? null : anterior.name(),
                nuevo.name(), actorId, motivo));
    }

    @Transactional(readOnly = true)
    public List<Item> listar(EntidadHistorial tipo, UUID entidadId) {
        return repository.findByEntidadTipoAndEntidadIdOrderByCreatedAtAsc(tipo, entidadId).stream()
                .map(h -> new Item(h.getEstadoAnterior(), h.getEstadoNuevo(), h.getActorId(), h.getMotivo(), h.getCreatedAt()))
                .toList();
    }

    public record Item(String estadoAnterior, String estadoNuevo, UUID actorId, String motivo, OffsetDateTime fecha) {}
}
