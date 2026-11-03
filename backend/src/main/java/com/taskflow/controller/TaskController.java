package com.taskflow.controller;

import com.taskflow.dto.TaskRequestDto;
import com.taskflow.dto.TaskResponseDto;
import com.taskflow.entity.TaskPriority;
import com.taskflow.entity.TaskStatus;
import com.taskflow.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@Tag(name = "Tasks", description = "Task management CRUD operations, filtering, and sorting")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "BearerAuth")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    @Operation(summary = "List all tasks for current user with optional filtering and sorting")
    public ResponseEntity<List<TaskResponseDto>> listTasks(
            @Parameter(description = "Filter by status (TODO, IN_PROGRESS, COMPLETED)")
            @RequestParam(required = false) TaskStatus status,
            @Parameter(description = "Filter by priority (LOW, MEDIUM, HIGH)")
            @RequestParam(required = false) TaskPriority priority,
            @Parameter(description = "Sort by field: 'dueDate' or 'createdAt' (default: createdAt)")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction: 'asc' or 'desc' (default: desc)")
            @RequestParam(defaultValue = "desc") String order) {

        List<TaskResponseDto> tasks = taskService.listTasks(status, priority, sortBy, order);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping
    @Operation(summary = "Create a new task")
    public ResponseEntity<TaskResponseDto> createTask(@Valid @RequestBody TaskRequestDto requestDto) {
        TaskResponseDto created = taskService.createTask(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get task by ID")
    public ResponseEntity<TaskResponseDto> getTaskById(@PathVariable Long id) {
        TaskResponseDto task = taskService.getTaskById(id);
        return ResponseEntity.ok(task);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing task")
    public ResponseEntity<TaskResponseDto> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskRequestDto requestDto) {

        TaskResponseDto updated = taskService.updateTask(id, requestDto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a task by ID")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}

