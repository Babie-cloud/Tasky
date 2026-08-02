import { Component, OnInit, inject } from '@angular/core';
import {
  CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup,
  moveItemInArray, transferArrayItem,
} from '@angular/cdk/drag-drop';
import { TaskService, Task } from '../../core/services/task-service';

@Component({
  selector: 'app-tache-card',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag],
  templateUrl: './tache-card.html',
  styleUrl: './tache-card.scss',
})
export class TacheCard implements OnInit {
  private taskService = inject(TaskService);

  todo: Task[] = [];
  done: Task[] = [];

  ngOnInit(): void {
    this.taskService.getTasks().subscribe((tasks) => {
      this.todo = tasks.filter(t => t.status === 'todo');
      this.done = tasks.filter(t => t.status === 'done');
    });
  }

  drop(event: CdkDragDrop<Task[]>) {
    const task = event.previousContainer.data[event.previousIndex];

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      // Le statut a changé (todo <-> done) -> on sauvegarde côté serveur
      const newStatus = event.container.data === this.done ? 'done' : 'todo';
      this.taskService.updateTask(task._id, { status: newStatus }).subscribe();
    }
  }

  deleteTask(taskId: string, list: Task[]): void {
    this.taskService.deleteTask(taskId).subscribe(() => {
      const index = list.findIndex(t => t._id === taskId);
      if (index > -1) list.splice(index, 1);
    });
  }
}