import { SendGuess } from '../guess';
import { DrawingUpdate } from './drawingUpdate';
import { GiveClue } from './giveClue';
import { GiveGuesses } from './giveGuesses';
import { GuessesScored } from './guessesScored';
import { PlayerLogin } from './playerLogin';
import { PlayerSelected } from './playerSelected';
import { sentDrawing } from './sentDrawing';
import { StateChanged } from './stateChanged';

export interface Message<T> {
    type: string;
    body: T;
}

export type DataMessage = sentDrawing | GiveClue
            | StateChanged | PlayerSelected
            | SendGuess | PlayerLogin
            | DrawingUpdate | GiveGuesses
            | GuessesScored;

export class DataMessageType {
    public static UserLogin = 'UserLogin';
    public static NewDrawing = 'NewDrawing';
    public static GiveClue = 'GiveClue';
    public static GiveGuesses = 'GiveGuesses';
    public static Guess = 'Guess';
    public static StateChange = 'StateChange';
    public static PlayerSelected = 'UserSelected;';
    public static DrawingUpdate = 'DrawingUpdate';
    public static GuessesScored = 'GuessesScored';
}
