package com.gajraj.product.repo;
import com.gajraj.product.model.CategoryStudio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface CategoryStudioRepo extends JpaRepository<CategoryStudio,UUID> {}
