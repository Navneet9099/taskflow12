package com.taskflow.service;

import com.taskflow.dto.TaskRequestDto;
import com.taskflow.dto.TaskResponseDto;
import com.taskflow.entity.Task;
import com.taskflow.entity.TaskPriority;
import com.taskflow.entity.TaskStatus;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.TaskSpecification;
import com.taskflow.repository.UserRepository;
import com.taskflow.security.UserPrincipal;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() == null) {
            throw new BadCredentialsException("Unauthenticated request");
        }

        Object principal = authentication.getPrincipal();
        String email;
        if (principal instanceof UserPrincipal userPrincipal) {
            email = userPrincipal.getEmail();
        } else if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else {
            email = principal.toString();
        }

        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional(readOnly = true)
    public List<TaskResponseDto> listTasks(TaskStatus status, TaskPriority priority, String sortBy, String order) {
        User user = getAuthenticatedUser();

        String sortField = "createdAt";
        if ("dueDate".equalsIgnoreCase(sortBy) || "due_date".equalsIgnoreCase(sortBy)) {
            sortField = "dueDate";
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(order) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, sortField);

        List<Task> tasks = taskRepository.findAll(TaskSpecification.filterTasks(user.getId(), status, priority), sort);
        return tasks.stream().map(TaskResponseDto::fromEntity).toList();
    }

    public TaskResponseDto createTask(TaskRequestDto requestDto) {
        User user = getAuthenticatedUser();

        TaskStatus status = requestDto.getStatus() != null ? requestDto.getStatus() : TaskStatus.TODO;
        TaskPriority priority = requestDto.getPriority() != null ? requestDto.getPriority() : TaskPriority.MEDIUM;

        Task task = new Task(
                requestDto.getTitle().trim(),
                requestDto.getDescription(),
                status,
                priority,
                requestDto.getDueDate(),
                user
        );

        Task saved = taskRepository.save(task);
        return TaskResponseDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public TaskResponseDto getTaskById(Long id) {
        User user = getAuthenticatedUser();
        Task task = taskRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return TaskResponseDto.fromEntity(task);
    }

    public TaskResponseDto updateTask(Long id, TaskRequestDto requestDto) {
        User user = getAuthenticatedUser();
        Task task = taskRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        task.setTitle(requestDto.getTitle().trim());
        task.setDescription(requestDto.getDescription());
        if (requestDto.getStatus() != null) {
            task.setStatus(requestDto.getStatus());
        }
        if (requestDto.getPriority() != null) {
            task.setPriority(requestDto.getPriority());
        }
        task.setDueDate(requestDto.getDueDate());

        Task updated = taskRepository.save(task);
        return TaskResponseDto.fromEntity(updated);
    }

    public void deleteTask(Long id) {
        User user = getAuthenticatedUser();
        Task task = taskRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        taskRepository.delete(task);
    }
}
