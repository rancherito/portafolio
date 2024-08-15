import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { kkk, systemPrompt } from './env';

@Component({
    selector: 'app-math-tutor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="math-tutor-container">
            <textarea [(ngModel)]="prompt" placeholder="Ingrese los datos de su componente"></textarea>
            <div class="button-container">
                @if (prompt != null && prompt.trim() != '') {
                    <button (click)="run()" class="action-button">Generar componte</button>
                }
                @if (jsonField || templateField || scriptField || stylesField) {
                    <button (click)="improve()" class="action-button">Mejorar Resultado</button>
                }
            </div>
            <div class="result-container">
                <div class="result-field">
                    <label>JSON</label>
                    <textarea [ngModel]="jsonField" rows="10" readonly></textarea>
                </div>
                <div class="result-field">
                    <label>TEMPLATE</label>
                    <textarea [ngModel]="templateField" rows="10" readonly></textarea>
                </div>
                <div class="result-field">
                    <label>SCRIPT</label>
                    <textarea [ngModel]="scriptField" rows="10" readonly></textarea>
                </div>
                <div class="result-field">
                    <label>STYLES</label>
                    <textarea [ngModel]="stylesField" rows="10" readonly></textarea>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .math-tutor-container {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        textarea {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        .button-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .action-button {
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .action-button:hover {
            background-color: #45a049;
        }
        .result-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        .result-field {
            display: flex;
            flex-direction: column;
        }
        label {
            font-weight: bold;
            margin-bottom: 5px;
        }
    `]
})
export class MathTutorComponent implements OnInit {
    result: string = '';
    openai = new OpenAI({
        apiKey: kkk,
        dangerouslyAllowBrowser: true,
    });

    @Input() prompt: string = '';

    jsonField: string = '';
    templateField: string = '';
    scriptField: string = '';
    stylesField: string = '';

    @Output() data = new EventEmitter<{ json: string; template: string; javascript: string; styles: string }>();

    async run() {
        if (this.prompt == null || this.prompt.trim() == '') return;
        await this.generateResponse(this.prompt);
    }

    async improve() {
        if (!this.jsonField && !this.templateField && !this.scriptField && !this.stylesField) return;
        
        const improvePrompt = this.prompt +  `y Mejora el siguiente componente:
        JSON: ${this.jsonField}
        TEMPLATE: ${this.templateField}
        SCRIPT: ${this.scriptField}
        STYLES: ${this.stylesField}`;

        await this.generateResponse(improvePrompt);
    }

    async generateResponse(prompt: string) {
        const InstructionFormat = z.object({
            template: z.string(),
            json: z.string(),
            styles: z.string(),
            javascript: z.string(),
        });

        const completion = await this.openai.beta.chat.completions.parse({
            model: 'gpt-4o-mini-2024-07-18',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                { role: 'user', content: prompt },
            ],
            response_format: zodResponseFormat(InstructionFormat, 'instruction'),
        });

        const data = completion.choices[0].message.parsed;

        this.jsonField = data?.json ?? '';
        this.templateField = data?.template ?? '';
        this.scriptField = data?.javascript ?? '';
        this.stylesField = data?.styles ?? '';

        this.data.emit({ json: this.jsonField, template: this.templateField, javascript: this.scriptField, styles: this.stylesField });
    }

    ngOnInit(): void {}
}