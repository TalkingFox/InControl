import { Subject } from 'rxjs';
import { Question } from '../models/question';
import { Util } from '../util';

export class QuestionService {
    private questions: Question[];

    public any(): boolean {
        if (!this.questions) {
            return false;
        }
        return this.questions.length > 0;
    }

    public reset(): void {
        this.questions = null;
    }

    public take(): Promise<Question> {
        const newQuestion = new Subject<Question>();
        this.get().then((questions: Question[]) => {
            Util.Shuffle(questions);
            const question = questions.pop();
            newQuestion.next(question);
            newQuestion.complete();
        });
        return newQuestion.toPromise();
    }

    private get(): Promise<Question[]> {
        if (this.questions) {
            return Promise.resolve(this.questions);
        }
        const http = new XMLHttpRequest();
        const questionSubject = new Subject<Question[]>();
        http.onreadystatechange = () => {
            if (http.readyState === 4 && http.status === 200) {
                const response = JSON.parse(http.response) as Question[];
                this.questions = response;
                questionSubject.next(response);
                questionSubject.complete();
            }
        };
        http.open('GET', './content/data.json', true);
        http.send();
        return questionSubject.toPromise();
    }
}
