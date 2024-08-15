import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DatasetViewerComponent } from './dataset-viewer.component';
import { DatabaseService, MessageGroup } from './database.service';

@Component({
    selector: 'app-gpt4-dataset-generator',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatSnackBarModule,
        DatasetViewerComponent
    ],
    template: `
        <mat-card class="container">
            <mat-card-header>
                <mat-card-title>GPT-4 Fine-tuning Dataset Generator</mat-card-title>
            </mat-card-header>
            <mat-card-content>
                <mat-form-field appearance="fill" class="full-width">
                    <mat-label>User Prompt</mat-label>
                    <input matInput [(ngModel)]="userPrompt" placeholder="Enter user prompt">
                </mat-form-field>
                <mat-form-field appearance="fill" class="full-width">
                    <mat-label>Assistant Response (JSON)</mat-label>
                    <textarea matInput [(ngModel)]="assistantResponse" placeholder="Enter assistant response JSON" rows="5"></textarea>
                </mat-form-field>
            </mat-card-content>
            <mat-card-actions>
                <button mat-raised-button color="primary" (click)="addEntry()">Add Entry</button>
                <button mat-raised-button color="warn" [disabled]="!dataset.length" (click)="downloadDataset()">Download Dataset (.jsonl)</button>
            </mat-card-actions>
        </mat-card>

        <mat-card class="container dataset-viewer" *ngIf="dataset.length > 0">
            <mat-card-header>
                <mat-card-title>Dataset Entries</mat-card-title>
            </mat-card-header>
            <mat-card-content>
                <app-dataset-viewer></app-dataset-viewer>
            </mat-card-content>
        </mat-card>
    `,
    styles: [`
        .container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
        }
        .full-width {
            width: 100%;
            margin-bottom: 15px;
        }
        mat-card-actions {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
        }
        button {
            margin: 5px;
        }
        .dataset-viewer {
            margin-top: 20px;
        }
    `]
})
export class GPT4DatasetGeneratorComponent implements OnInit {
    userPrompt: string = '';
    assistantResponse: string = '';
    dataset: MessageGroup[] = [];

    constructor(
        private snackBar: MatSnackBar,
        private databaseService: DatabaseService
    ) {}

    ngOnInit() {
        this.databaseService.getDataset().subscribe(dataset => {
            this.dataset = dataset;
        });
    }

    async addEntry() {
        if (this.userPrompt && this.assistantResponse) {
            try {
                const assistantContent = JSON.parse(this.assistantResponse);
                const newEntry: MessageGroup = {
                    messages: [
                        { role: 'system', content: 'ERES UNA DISEÑADORA DE COMPONENTES' },
                        { role: 'user', content: this.userPrompt + '. TU FORMATO DE SALIDA SON JSON CON FORMA: {template: string, javascript: string, styles: string, json: string}' },
                        { role: 'assistant', content: JSON.stringify(assistantContent) },
                    ],
                };

                await this.databaseService.addEntry(newEntry);
                this.resetInputs();
                this.showSnackBar('Entry added successfully');
            } catch (error) {
                this.showSnackBar('Error parsing assistant response JSON. Please check the format and try again.');
            }
        } else {
            this.showSnackBar('Please fill in both the user prompt and assistant response fields.');
        }
    }

    resetInputs() {
        this.userPrompt = '';
        this.assistantResponse = '';
    }

    downloadDataset() {
        const jsonlContent = this.dataset.map((entry) => JSON.stringify({ messages: entry.messages })).join('\n');
        const blob = new Blob([jsonlContent], { type: 'application/x-jsonlines' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gpt4_fine_tuning_dataset.jsonl';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.showSnackBar('Dataset downloaded successfully');
    }

    showSnackBar(message: string) {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
        });
    }
}