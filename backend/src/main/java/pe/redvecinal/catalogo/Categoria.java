package pe.redvecinal.catalogo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Categoría jerárquica (def_categoria, RF12). Agregar categorías nuevas es solo insertar filas:
 * ningún módulo cambia (RNF-45).
 */
@Entity
@Table(name = "def_categoria")
@Getter
@NoArgsConstructor
public class Categoria {

    @Id
    private Integer id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "ambito_categoria")
    private AmbitoCategoria ambito;

    @Column(name = "padre_id")
    private Integer padreId;

    @Column(nullable = false, length = 50)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false)
    private boolean activa;
}
