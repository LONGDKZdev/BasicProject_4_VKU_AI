package com.vku.flashcard_ai.modules.ai.model;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findByUsernameOrderByUpdatedAtDesc(String username);
}