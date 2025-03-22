package ru.bikmeev.quizz.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import ru.bikmeev.quizz.dto.AttemptResponse;
import ru.bikmeev.quizz.service.QuizPlayService;

@Controller
@RequestMapping("/quiz")
@RequiredArgsConstructor
public class QuizPlayController {

    private final QuizPlayService quizPlayService;

    @PostMapping("/{quizId}/start")
    public String startQuiz(@PathVariable Long quizId, Model model) {
        AttemptResponse response = quizPlayService.createAttempt(quizId);
        model.addAttribute("attempt", response);
        return "quiz_play";
    }

    //@GetMapping("/{quizId}/attempt/{attemptId}/question/{questionIndex}")
}
