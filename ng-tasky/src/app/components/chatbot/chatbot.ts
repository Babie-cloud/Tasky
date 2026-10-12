import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chatbot',
  standalone: true, 
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.scss']
})
export class Chatbot {
  isOpen = false;
  userInput = '';
  messages: { text: string; isUser: boolean }[] = [
    { text: "Bonjour ! Je suis ton assistant Tasky. Comment puis-je t'aider dans l'organisation de tes tâches ?", isUser: false }
  ];

  constructor(private http: HttpClient) {}

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const userMsg = this.userInput;
    this.messages.push({ text: userMsg, isUser: true });
    this.userInput = '';

    this.http.post<any>(`${environment.apiUrl}/api/ai/chat`, { message: userMsg }).subscribe({
      next: (res) => {
        this.messages.push({ text: res.reply, isUser: false });
      },
      error: () => {
        this.messages.push({ text: "Désolé, une erreur est survenue avec l'assistant.", isUser: false });
      }
    });
  }
}