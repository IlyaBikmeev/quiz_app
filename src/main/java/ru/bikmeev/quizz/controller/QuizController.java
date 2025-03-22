package ru.bikmeev.quizz.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import ru.bikmeev.quizz.dto.CreateQuizRequest;
import ru.bikmeev.quizz.dto.QuizResponse;
import ru.bikmeev.quizz.service.QuizService;


@Controller
@RequiredArgsConstructor
@RequestMapping("/quiz")
public class QuizController {

    private final QuizService quizService;

    @GetMapping
    public String getQuizPage(Model model,
                              @RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "5") int size) {
        model.addAttribute("quizPage", quizService.getQuizPage(page, size));
        return "quizzes";
    }

    @GetMapping("/{id}")
    public String showQuizDetails(@PathVariable Integer id, Model model) {
        model.addAttribute("quiz", quizService.getQuiz(id));
        return "quiz_details";
    }

    @GetMapping("/new")
    public String chooseQuizCreationOptions() {
        return "choose_quiz_creation";
    }

    @GetMapping("/new/manual")
    public String getCreateQuizPage() {
        return "create_quiz";
    }

    @GetMapping("/new/import")
    public String getImportQuizPage() {
        return "import_quiz";
    }

    @PostMapping("/new/manual")
    public String createQuiz(@ModelAttribute CreateQuizRequest request,
                             BindingResult bindingResult,
                             RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            return "create_quiz";
        }
        quizService.create(request);
        redirectAttributes.addFlashAttribute("message", "Квиз успешно создан!");
        return "redirect:/quiz";
    }

    @PostMapping("/new/import")
    public String importQuizFromFile(@RequestParam("file") MultipartFile file) {
        quizService.importQuizFromFile(file);
        return "redirect:/quiz";
    }
}