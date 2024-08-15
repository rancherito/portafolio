import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { DatabaseService, MessageGroup } from './database.service';

interface AssistantResponse {
    json: string;
    template: string;
    javascript: string;
    styles: string;
}

@Component({
    selector: 'app-dataset-viewer',
    standalone: true,
    imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatSnackBarModule],
    template: `
        <table mat-table [dataSource]="dataSource" multiTemplateDataRows class="mat-elevation-z8">
            <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let element">{{ element.id }}</td>
            </ng-container>

            <ng-container matColumnDef="userPrompt">
                <th mat-header-cell *matHeaderCellDef>User Prompt</th>
                <td mat-cell *matCellDef="let element">{{ element.messages[1].content }}</td>
            </ng-container>

            <ng-container matColumnDef="expandedDetail">
                <td mat-cell *matCellDef="let element" [attr.colspan]="displayedColumns.length">
                    <div class="element-detail" [@detailExpand]="element == expandedElement ? 'expanded' : 'collapsed'">
                        <mat-accordion>
                            <mat-expansion-panel>
                                <mat-expansion-panel-header>
                                    <mat-panel-title>Assistant Response</mat-panel-title>
                                </mat-expansion-panel-header>
                                <ng-container *ngIf="expandedElement === element">
                                    <mat-form-field class="full-width">
                                        <mat-label>JSON</mat-label>
                                        <textarea matInput [(ngModel)]="editableJson" rows="10"></textarea>
                                    </mat-form-field>
                                    <mat-form-field class="full-width">
                                        <mat-label>Template</mat-label>
                                        <textarea matInput [value]="getAssistantResponse(element).template" readonly rows="10"></textarea>
                                    </mat-form-field>
                                    <mat-form-field class="full-width">
                                        <mat-label>JavaScript</mat-label>
                                        <textarea matInput [value]="getAssistantResponse(element).javascript" readonly rows="10"></textarea>
                                    </mat-form-field>
                                    <mat-form-field class="full-width">
                                        <mat-label>Styles</mat-label>
                                        <textarea matInput [value]="getAssistantResponse(element).styles" readonly rows="10"></textarea>
                                    </mat-form-field>
                                    <button mat-raised-button color="primary" (click)="saveChanges(element)">Save Changes</button>
                                </ng-container>
                            </mat-expansion-panel>
                        </mat-accordion>
                    </div>
                </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let element; columns: displayedColumns" class="element-row" [class.expanded-row]="expandedElement === element" (click)="expandElement(element)"></tr>
            <tr mat-row *matRowDef="let row; columns: ['expandedDetail']" class="detail-row"></tr>
        </table>
    `,
    styles: [
        `
            table {
                width: 100%;
            }
            tr.detail-row {
                height: 0;
            }
            tr.element-row:not(.expanded-row):hover {
                background: whitesmoke;
            }
            tr.element-row:not(.expanded-row):active {
                background: #efefef;
            }
            .element-row td {
                border-bottom-width: 0;
            }
            .element-detail {
                overflow: hidden;
                display: flex;
            }
            .mat-column-id {
                flex: 0 0 50px;
            }
            .mat-column-userPrompt {
                padding-right: 16px;
            }
            .full-width {
                width: 100%;
                margin-bottom: 15px;
            }
            pre {
                white-space: pre-wrap;
                word-wrap: break-word;
            }
        `,
    ],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
})
export class DatasetViewerComponent implements OnInit {
    @ViewChild(MatTable) table!: MatTable<any>;

    displayedColumns: string[] = ['id', 'userPrompt'];
    dataSource: MessageGroup[] = [];
    expandedElement: MessageGroup | null = null;
    editableJson: string = '';

    constructor(
        private databaseService: DatabaseService,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit() {
        this.databaseService.getDataset().subscribe((dataset) => {
            this.dataSource = dataset;
            if (this.table) {
                this.table.renderRows();
            }
        });
    }

    expandElement(element: MessageGroup) {
        this.expandedElement = this.expandedElement === element ? null : element;
        if (this.expandedElement) {
            this.editableJson = this.getPrettyPrintedJSON(this.getAssistantResponse(element).json);
        }
    }

    getPrettyPrintedJSON(jsonString: string): string {
        try {
            const obj = JSON.parse(jsonString);
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return jsonString;
        }
    }

    getAssistantResponse(element: MessageGroup): AssistantResponse {
        try {
            return JSON.parse(element.messages[2].content);
        } catch (e) {
            console.error('Error parsing assistant response:', e);
            return { json: '', template: '', javascript: '', styles: '' };
        }
    }

    async saveChanges(element: MessageGroup) {
        try {
            // Validar que el JSON sea válido
            JSON.parse(this.editableJson);

            const assistantResponse = this.getAssistantResponse(element);
            assistantResponse.json = this.editableJson;

            const updatedContent = JSON.stringify(assistantResponse);
            element.messages[2].content = updatedContent;

            await this.databaseService.updateEntry(element);
            this.snackBar.open('Changes saved successfully', 'Close', { duration: 3000 });
        } catch (error) {
            console.error('Error saving changes:', error);
            this.snackBar.open('Error saving changes. Please check the JSON format.', 'Close', { duration: 3000 });
        }
    }
}
