import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Message {
    role: string;
    content: string;
}

export interface MessageGroup {
    id?: number;
    messages: Message[];
}

@Injectable({
    providedIn: 'root',
})
export class DatabaseService extends Dexie {
    private datasetEntries!: Dexie.Table<MessageGroup, number>;
    private datasetSubject: BehaviorSubject<MessageGroup[]> = new BehaviorSubject<MessageGroup[]>([]);

    constructor() {
        super('GPT4DatasetDatabase');
        this.version(1).stores({
            datasetEntries: '++id',
        });
        this.datasetEntries = this.table('datasetEntries');
        this.loadAllEntries();
    }

    private async loadAllEntries(): Promise<void> {
        try {
            const allEntries = await this.datasetEntries.toArray();
            this.datasetSubject.next(allEntries);
        } catch (error) {
            console.error('Error loading entries:', error);
            this.datasetSubject.next([]);
        }
    }

    getDataset(): Observable<MessageGroup[]> {
        return this.datasetSubject.asObservable();
    }

    async addEntry(entry: MessageGroup): Promise<number> {
        try {
            const id = await this.datasetEntries.add(entry);
            await this.loadAllEntries();
            return id;
        } catch (error) {
            console.error('Error adding entry:', error);
            throw error;
        }
    }

    async updateEntry(entry: MessageGroup): Promise<void> {
        try {
            if (!entry.id) {
                throw new Error('Entry ID is missing');
            }
            await this.datasetEntries.update(entry.id, { messages: entry.messages });
            await this.loadAllEntries();
        } catch (error) {
            console.error('Error updating entry:', error);
            throw error;
        }
    }

    async updateAssistantContent(id: number, newContent: string): Promise<void> {
        try {
            const entry = await this.datasetEntries.get(id);
            if (!entry) {
                throw new Error('Entry not found');
            }

            if (entry.messages.length < 3) {
                throw new Error('Invalid message structure');
            }

            entry.messages[2].content = newContent;
            await this.datasetEntries.update(id, { messages: entry.messages });
            await this.loadAllEntries();
        } catch (error) {
            console.error('Error updating assistant content:', error);
            throw error;
        }
    }

    async deleteEntry(id: number): Promise<void> {
        try {
            await this.datasetEntries.delete(id);
            await this.loadAllEntries();
        } catch (error) {
            console.error('Error deleting entry:', error);
            throw error;
        }
    }

    async saveProgress(dataset: MessageGroup[]): Promise<void> {
        try {
            await this.datasetEntries.clear();
            await this.datasetEntries.bulkAdd(dataset);
            await this.loadAllEntries();
        } catch (error) {
            console.error('Error saving progress:', error);
            throw error;
        }
    }
}
