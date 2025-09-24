import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  _orderBy,
  _limit,
  onSnapshot,
  Timestamp,
  DocumentReference,
  CollectionReference,
  QueryConstraint,
  enableNetwork,
  disableNetwork,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { FirebaseError } from '../types/firebase';

/**
 * Base Firebase service class with common CRUD operations
 * and error handling for all Firebase services
 */
export class FirebaseService {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Check if Firebase is configured and available
   */
  protected isFirebaseAvailable(): boolean {
    return isFirebaseConfigured() && db !== null;
  }

  /**
   * Get collection reference
   */
  protected getCollection(): CollectionReference {
    if (!this.isFirebaseAvailable()) {
      throw new Error('Firebase is not configured. Using mock data instead.');
    }
    return collection(db, this.collectionName);
  }

  /**
   * Get document reference
   */
  protected getDocRef(id: string): DocumentReference {
    if (!this.isFirebaseAvailable()) {
      throw new Error('Firebase is not configured. Using mock data instead.');
    }
    return doc(db, this.collectionName, id);
  }

  /**
   * Create a new document
   */
  protected async create<T>(data: Omit<T, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(this.getCollection(), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a document by ID
   */
  protected async getById<T>(id: string): Promise<T | null> {
    try {
      const docSnap = await getDoc(this.getDocRef(id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all documents with optional query constraints
   */
  protected async getAll<T>(constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = query(this.getCollection(), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a document
   */
  protected async update<T>(id: string, data: Partial<T>): Promise<void> {
    try {
      await updateDoc(this.getDocRef(id), {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a document
   */
  protected async delete(id: string): Promise<void> {
    try {
      await deleteDoc(this.getDocRef(id));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set up real-time listener
   */
  protected setupListener<T>(
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = []
  ): () => void {
    const q = query(this.getCollection(), ...constraints);

    return onSnapshot(
      q,
      snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        callback(data);
      },
      error => {
        console.error(`Listener error for ${this.collectionName}:`, error);
        throw this.handleError(error);
      }
    );
  }

  /**
   * Query documents with conditions
   */
  protected async query<T>(
    field: string,
    operator: any,
    value: any,
    additionalConstraints: QueryConstraint[] = []
  ): Promise<T[]> {
    try {
      const q = query(
        this.getCollection(),
        where(field, operator, value),
        ...additionalConstraints
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle Firebase errors and convert to user-friendly messages
   */
  protected handleError(error: any): FirebaseError {
    console.error(`Firebase error in ${this.collectionName}:`, error);

    const firebaseError: FirebaseError = {
      code: error.code || 'unknown',
      message: this.getErrorMessage(error.code),
      malayalamMessage: this.getMalayalamErrorMessage(error.code),
      retryable: this.isRetryableError(error.code),
    };

    return firebaseError;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(code: string): string {
    switch (code) {
      case 'permission-denied':
        return 'You do not have permission to access this data.';
      case 'not-found':
        return 'The requested data was not found.';
      case 'unavailable':
        return 'Service is temporarily unavailable. Please try again.';
      case 'deadline-exceeded':
        return 'Request timed out. Please check your connection.';
      case 'resource-exhausted':
        return 'Too many requests. Please try again later.';
      case 'unauthenticated':
        return 'Please log in to access this feature.';
      case 'cancelled':
        return 'Request was cancelled.';
      case 'data-loss':
        return 'Data corruption detected. Please contact support.';
      case 'failed-precondition':
        return 'Operation failed due to system state.';
      case 'internal':
        return 'Internal server error. Please try again.';
      case 'invalid-argument':
        return 'Invalid request. Please check your input.';
      case 'out-of-range':
        return 'Request parameter out of valid range.';
      case 'unimplemented':
        return 'Feature not yet implemented.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Get Malayalam error message
   */
  private getMalayalamErrorMessage(code: string): string {
    switch (code) {
      case 'permission-denied':
        return 'ഈ ഡാറ്റ ആക്സസ് ചെയ്യാൻ നിങ്ങൾക്ക് അനുമതിയില്ല.';
      case 'not-found':
        return 'ആവശ്യപ്പെട്ട ഡാറ്റ കണ്ടെത്തിയില്ല.';
      case 'unavailable':
        return 'സേവനം താൽക്കാലികമായി ലഭ്യമല്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.';
      case 'deadline-exceeded':
        return 'അഭ്യർത്ഥന സമയപരിധി കഴിഞ്ഞു. നിങ്ങളുടെ കണക്ഷൻ പരിശോധിക്കുക.';
      case 'resource-exhausted':
        return 'വളരെയധികം അഭ്യർത്ഥനകൾ. ദയവായി പിന്നീട് ശ്രമിക്കുക.';
      case 'unauthenticated':
        return 'ഈ ഫീച്ചർ ആക്സസ് ചെയ്യാൻ ദയവായി ലോഗിൻ ചെയ്യുക.';
      case 'cancelled':
        return 'അഭ്യർത്ഥന റദ്ദാക്കി.';
      case 'data-loss':
        return 'ഡാറ്റ കേടുപാടുകൾ കണ്ടെത്തി. ദയവായി സപ്പോർട്ടിനെ ബന്ധപ്പെടുക.';
      case 'failed-precondition':
        return 'സിസ്റ്റം അവസ്ഥ കാരണം പ്രവർത്തനം പരാജയപ്പെട്ടു.';
      case 'internal':
        return 'ആന്തരിക സെർവർ പിശക്. ദയവായി വീണ്ടും ശ്രമിക്കുക.';
      case 'invalid-argument':
        return 'അസാധുവായ അഭ്യർത്ഥന. നിങ്ങളുടെ ഇൻപുട്ട് പരിശോധിക്കുക.';
      case 'out-of-range':
        return 'അഭ്യർത്ഥന പാരാമീറ്റർ സാധുവായ പരിധിക്ക് പുറത്താണ്.';
      case 'unimplemented':
        return 'ഫീച്ചർ ഇതുവരെ നടപ്പിലാക്കിയിട്ടില്ല.';
      default:
        return 'അപ്രതീക്ഷിത പിശക് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.';
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(code: string): boolean {
    const retryableCodes = [
      'unavailable',
      'deadline-exceeded',
      'resource-exhausted',
      'internal',
      'cancelled',
    ];
    return retryableCodes.includes(code);
  }

  /**
   * Enable offline persistence
   */
  static async enableOffline(): Promise<void> {
    try {
      await disableNetwork(db);
      console.warn('Firebase offline mode enabled');
    } catch (error) {
      console.error('Failed to enable offline mode:', error);
    }
  }

  /**
   * Enable online mode
   */
  static async enableOnline(): Promise<void> {
    try {
      await enableNetwork(db);
      console.warn('Firebase online mode enabled');
    } catch (error) {
      console.error('Failed to enable online mode:', error);
    }
  }

  /**
   * Initialize offline persistence for better user experience
   */
  static async initializeOfflinePersistence(): Promise<void> {
    try {
      // Firestore automatically enables offline persistence by default
      // This method can be used to configure additional offline settings
      console.warn('Firebase offline persistence initialized');
    } catch (error) {
      console.error('Failed to initialize offline persistence:', error);
    }
  }

  /**
   * Check network connectivity and handle offline/online states
   */
  static async handleNetworkStateChange(isOnline: boolean): Promise<void> {
    try {
      if (isOnline) {
        await this.enableOnline();
      } else {
        await this.enableOffline();
      }
    } catch (error) {
      console.error('Failed to handle network state change:', error);
    }
  }

  /**
   * Convert JavaScript Date to Firestore Timestamp
   */
  protected dateToTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }

  /**
   * Convert Firestore Timestamp to JavaScript Date
   */
  protected timestampToDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }
}
