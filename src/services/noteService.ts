import { Note, NoteView, NoteBookmark, _NoteDifficulty } from '../types/note';
import {
  ApiResponse,
  PaginationOptions,
  SearchOptions,
  FilterOptions,
} from '../types/common';
import { FirebaseNote, FIREBASE_COLLECTIONS } from '../types/firebase';
import { FirebaseService } from './firebaseService';
import { StorageService } from './storageService';
import {
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp as _FirestoreTimestamp,
} from 'firebase/firestore';

export class NoteService extends FirebaseService {
  private static instance: NoteService;
  private static readonly STORAGE_KEY = 'notes';
  private static readonly VIEWS_STORAGE_KEY = 'note_views';
  private static readonly BOOKMARKS_STORAGE_KEY = 'note_bookmarks';

  constructor() {
    super(FIREBASE_COLLECTIONS.NOTES);
  }

  static getInstance(): NoteService {
    if (!NoteService.instance) {
      NoteService.instance = new NoteService();
    }
    return NoteService.instance;
  }

  // Mock data for development
  private static mockNotes: Note[] = [
    {
      id: 'note-1',
      classSessionId: 'class-1',
      title: 'Islamic History - Key Events Timeline',
      content: `# Islamic History Timeline

## Pre-Islamic Period (Before 610 CE)
- Arabian Peninsula context
- Tribal society and trade routes
- Religious practices before Islam

## Early Islamic Period (610-661 CE)
### Prophet Muhammad's Life (570-632 CE)
- Birth in Mecca
- First revelation (610 CE)
- Hijra to Medina (622 CE)
- Conquest of Mecca (630 CE)

### Rashidun Caliphate (632-661 CE)
- Abu Bakr (632-634 CE)
- Umar ibn al-Khattab (634-644 CE)
- Uthman ibn Affan (644-656 CE)
- Ali ibn Abi Talib (656-661 CE)

## Umayyad Caliphate (661-750 CE)
- Capital: Damascus
- Expansion into Spain and Central Asia
- Administrative developments

## Abbasid Caliphate (750-1258 CE)
- Capital: Baghdad
- Golden Age of Islamic civilization
- Scientific and cultural achievements`,
      summary:
        'Comprehensive timeline of early Islamic history from pre-Islamic Arabia through the Abbasid period',
      pdfUrl: '/pdfs/islamic-history-timeline.pdf',
      imageUrls: [
        '/images/islamic-timeline-chart.jpg',
        '/images/early-islamic-map.jpg',
      ],
      author: 'Dr. Ahmad Hassan',
      subject: 'Islamic History',
      tags: ['history', 'timeline', 'caliphate', 'prophet', 'early-islam'],
      isPublic: true,
      downloadCount: 34,
      viewCount: 89,
      fileSize: 2048000, // 2MB PDF
      pageCount: 12,
      language: 'en',
      difficulty: 'intermediate',
      attachments: [
        {
          id: 'att-1',
          name: 'Islamic History Timeline.pdf',
          type: 'pdf',
          url: '/pdfs/islamic-history-timeline.pdf',
          size: 2048000,
          mimeType: 'application/pdf',
          description: 'Complete timeline with detailed explanations',
        },
        {
          id: 'att-2',
          name: 'Timeline Chart.jpg',
          type: 'image',
          url: '/images/islamic-timeline-chart.jpg',
          size: 512000,
          mimeType: 'image/jpeg',
          description: 'Visual timeline chart',
        },
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'note-2',
      classSessionId: 'class-2',
      title: 'Tajweed Rules - Basic Principles',
      content: `# Tajweed Rules - Basic Principles

## What is Tajweed?
Tajweed (تجويد) means "to make better" or "to improve." It refers to the rules governing the proper pronunciation of the Quran.

## Fundamental Rules

### 1. Makharij (مخارج) - Points of Articulation
- **Throat (الحلق)**: Letters ء، ه، ع، ح، غ، خ
- **Tongue (اللسان)**: Letters ق، ك، ج، ش، ي، ض، ل، ن، ر، ط، د، ت، ص، ز، س، ث، ذ، ظ
- **Lips (الشفتان)**: Letters ف، ب، م، و

### 2. Sifaat (صفات) - Characteristics of Letters
- **Hams (همس)**: Breathiness
- **Jahr (جهر)**: Voicing
- **Shidda (شدة)**: Strength
- **Rakhawa (رخاوة)**: Softness

### 3. Noon Sakinah and Tanween Rules
- **Izhaar (إظهار)**: Clear pronunciation
- **Idghaam (إدغام)**: Merging
- **Iqlaab (إقلاب)**: Conversion
- **Ikhfaa (إخفاء)**: Concealment

### 4. Meem Sakinah Rules
- **Ikhfaa Shafawi**: Labial concealment
- **Idghaam Mithlayn**: Similar merging
- **Izhaar Shafawi**: Labial clarity

## Practice Tips
1. Start slowly and focus on accuracy
2. Listen to qualified reciters
3. Practice regularly with a teacher
4. Record yourself and compare`,
      summary:
        'Essential tajweed rules for proper Quran recitation including makharij, sifaat, and key pronunciation rules',
      pdfUrl: '/pdfs/tajweed-basic-principles.pdf',
      imageUrls: [
        '/images/makharij-diagram.jpg',
        '/images/tajweed-rules-chart.jpg',
      ],
      author: 'Qari Muhammad Ali',
      subject: 'Quran Recitation',
      tags: ['tajweed', 'quran', 'recitation', 'pronunciation', 'makharij'],
      isPublic: true,
      downloadCount: 67,
      viewCount: 156,
      fileSize: 3145728, // 3MB PDF
      pageCount: 18,
      language: 'both',
      difficulty: 'beginner',
      attachments: [
        {
          id: 'att-3',
          name: 'Tajweed Basic Principles.pdf',
          type: 'pdf',
          url: '/pdfs/tajweed-basic-principles.pdf',
          size: 3145728,
          mimeType: 'application/pdf',
          description: 'Complete guide with examples and exercises',
        },
        {
          id: 'att-4',
          name: 'Makharij Diagram.jpg',
          type: 'image',
          url: '/images/makharij-diagram.jpg',
          size: 768000,
          mimeType: 'image/jpeg',
          description: 'Anatomical diagram showing points of articulation',
        },
      ],
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-22'),
    },
    {
      id: 'note-3',
      classSessionId: 'class-3',
      title: 'Five Pillars of Islam - Detailed Study',
      content: `# The Five Pillars of Islam (أركان الإسلام الخمسة)

## 1. Shahada (الشهادة) - Declaration of Faith
**Arabic**: لا إله إلا الله محمد رسول الله
**Translation**: "There is no god but Allah, and Muhammad is His messenger."

### Significance:
- Foundation of Islamic belief
- Testimony of monotheism (Tawheed)
- Acknowledgment of Prophet Muhammad's prophethood

## 2. Salah (الصلاة) - Prayer
**Five daily prayers:**
- Fajr (Dawn)
- Dhuhr (Midday)
- Asr (Afternoon)
- Maghrib (Sunset)
- Isha (Night)

### Requirements:
- Ritual purification (Wudu)
- Facing Qibla (Mecca)
- Proper timing
- Correct postures and recitations

## 3. Zakat (الزكاة) - Obligatory Charity
**Rate**: 2.5% of eligible wealth annually

### Conditions:
- Nisab (minimum threshold)
- One lunar year of ownership
- Wealth must be productive

### Recipients (8 categories):
1. The poor (Fuqara)
2. The needy (Masakin)
3. Zakat collectors
4. Those whose hearts are to be reconciled
5. Slaves seeking freedom
6. Debtors
7. In the path of Allah
8. Travelers in need

## 4. Sawm (الصوم) - Fasting
**Month**: Ramadan (9th month of Islamic calendar)

### Rules:
- Abstain from food, drink, and marital relations
- From dawn (Fajr) to sunset (Maghrib)
- Spiritual purification and self-discipline

### Exemptions:
- Illness, travel, pregnancy, menstruation
- Must make up missed days later

## 5. Hajj (الحج) - Pilgrimage
**Location**: Mecca, Saudi Arabia
**Timing**: 8th-12th of Dhul Hijjah

### Requirements:
- Physical and financial ability
- Mental competency
- Safe travel conditions

### Key Rituals:
- Ihram (sacred state)
- Tawaf (circumambulation of Kaaba)
- Sa'i (walking between Safa and Marwah)
- Standing at Arafat
- Stoning of pillars
- Animal sacrifice`,
      summary:
        'Comprehensive study of the Five Pillars of Islam with detailed explanations, requirements, and significance',
      pdfUrl: '/pdfs/five-pillars-detailed.pdf',
      imageUrls: [
        '/images/five-pillars-infographic.jpg',
        '/images/kaaba-hajj.jpg',
        '/images/prayer-positions.jpg',
      ],
      author: 'Sheikh Abdullah Rahman',
      subject: 'Islamic Fundamentals',
      tags: [
        'five-pillars',
        'shahada',
        'salah',
        'zakat',
        'sawm',
        'hajj',
        'fundamentals',
      ],
      isPublic: true,
      downloadCount: 123,
      viewCount: 234,
      fileSize: 4194304, // 4MB PDF
      pageCount: 25,
      language: 'both',
      difficulty: 'beginner',
      attachments: [
        {
          id: 'att-5',
          name: 'Five Pillars Detailed Study.pdf',
          type: 'pdf',
          url: '/pdfs/five-pillars-detailed.pdf',
          size: 4194304,
          mimeType: 'application/pdf',
          description:
            'Complete guide with Arabic text, translations, and practical guidance',
        },
      ],
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-25'),
    },
  ];

  // Get all notes with pagination and filtering
  static async getNotes(
    options?: PaginationOptions & FilterOptions
  ): Promise<ApiResponse<Note[]>> {
    try {
      const service = NoteService.getInstance();
      const constraints = [];

      // Build Firestore query constraints
      if (options?.classSessionId) {
        constraints.push(where('classSessionId', '==', options.classSessionId));
      }
      if (options?.subject) {
        constraints.push(where('subject', '==', options.subject));
      }
      if (options?.difficulty) {
        constraints.push(where('difficulty', '==', options.difficulty));
      }
      if (options?.language) {
        constraints.push(where('language', 'in', [options.language, 'both']));
      }
      if (options?.isPublic !== undefined) {
        constraints.push(where('isPublic', '==', options.isPublic));
      }

      // Add ordering
      const orderField = options?.orderBy || 'createdAt';
      const orderDirection = options?.orderDirection || 'desc';
      constraints.push(orderBy(orderField, orderDirection));

      // Add limit
      if (options?.limit) {
        constraints.push(firestoreLimit(options.limit));
      }

      const firestoreNotes = await service.getAll<FirebaseNote>(constraints);

      // Convert Firestore data to Note format
      const notes: Note[] = firestoreNotes.map(note => ({
        ...note,
        createdAt: note.createdAt.toDate(),
        updatedAt: note.updatedAt.toDate(),
        // Add default values for fields that might not exist in Firestore
        summary: note.summary || '',
        imageUrls: note.imageUrls || [],
        author: note.author || 'Unknown',
        subject: note.subject || 'General',
        tags: note.tags || [],
        isPublic: note.isPublic ?? true,
        downloadCount: note.downloadCount || 0,
        viewCount: note.viewCount || 0,
        fileSize: note.fileSize || 0,
        pageCount: note.pageCount || 1,
        language: note.language || 'en',
        difficulty: note.difficulty || 'beginner',
        attachments: note.attachments || [],
      }));

      // Apply client-side pagination if offset is specified
      let paginatedNotes = notes;
      if (options?.offset) {
        const offset = options.offset;
        const limit = options.limit || 10;
        paginatedNotes = notes.slice(offset, offset + limit);
      }

      return {
        data: paginatedNotes,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching notes:', error);

      // Fallback to mock data
      return this.getMockNotes(options);
    }
  }

  // Fallback method using mock data
  private static async getMockNotes(
    options?: PaginationOptions & FilterOptions
  ): Promise<ApiResponse<Note[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      let notes = [...this.mockNotes];

      // Apply filters
      if (options?.classSessionId) {
        notes = notes.filter(n => n.classSessionId === options.classSessionId);
      }
      if (options?.subject) {
        notes = notes.filter(n => n.subject === options.subject);
      }
      if (options?.difficulty) {
        notes = notes.filter(n => n.difficulty === options.difficulty);
      }
      if (options?.language) {
        notes = notes.filter(
          n => n.language === options.language || n.language === 'both'
        );
      }
      if (options?.isPublic !== undefined) {
        notes = notes.filter(n => n.isPublic === options.isPublic);
      }

      // Apply sorting
      if (options?.orderBy) {
        notes.sort((a, b) => {
          const aValue = a[options.orderBy as keyof Note];
          const bValue = b[options.orderBy as keyof Note];
          const direction = options.orderDirection === 'desc' ? -1 : 1;

          if (aValue < bValue) {
            return -1 * direction;
          }
          if (aValue > bValue) {
            return 1 * direction;
          }
          return 0;
        });
      }

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || 10;
      let paginatedNotes = notes.slice(offset, offset + limit);

      return {
        data: paginatedNotes,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notes',
        timestamp: new Date(),
      };
    }
  }

  // Get note by ID
  static async getNoteById(id: string): Promise<ApiResponse<Note | null>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const note = this.mockNotes.find(n => n.id === id);

      if (note) {
        // Increment view count
        const noteIndex = this.mockNotes.findIndex(n => n.id === id);
        if (noteIndex !== -1) {
          this.mockNotes[noteIndex].viewCount += 1;
        }
      }

      return {
        data: note || null,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch note',
        timestamp: new Date(),
      };
    }
  }

  // Search notes
  static async searchNotes(
    searchOptions: SearchOptions,
    paginationOptions?: PaginationOptions
  ): Promise<ApiResponse<Note[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 250));

      const {
        query,
        fields = ['title', 'content', 'summary', 'tags'],
        caseSensitive = false,
      } = searchOptions;
      const searchTerm = caseSensitive ? query : query.toLowerCase();

      let filteredNotes = this.mockNotes.filter(note => {
        return fields.some(field => {
          const fieldValue = note[field as keyof Note];
          if (Array.isArray(fieldValue)) {
            return fieldValue.some(item =>
              caseSensitive
                ? item.includes(searchTerm)
                : item.toLowerCase().includes(searchTerm)
            );
          }
          if (typeof fieldValue === 'string') {
            return caseSensitive
              ? fieldValue.includes(searchTerm)
              : fieldValue.toLowerCase().includes(searchTerm);
          }
          return false;
        });
      });

      // Apply pagination
      const offset = paginationOptions?.offset || 0;
      const limit = paginationOptions?.limit || 10;
      filteredNotes = filteredNotes.slice(offset, offset + limit);

      return {
        data: filteredNotes,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        timestamp: new Date(),
      };
    }
  }

  // Track note view
  static async trackView(
    noteId: string,
    userId: string,
    duration: number,
    pagesViewed?: number[]
  ): Promise<ApiResponse<boolean>> {
    try {
      const view: NoteView = {
        id: `view-${Date.now()}`,
        noteId,
        userId,
        viewedAt: new Date(),
        duration,
        pagesViewed,
        downloaded: false,
      };

      await StorageService.appendToArray(this.VIEWS_STORAGE_KEY, view);

      return {
        data: true,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track view',
        timestamp: new Date(),
      };
    }
  }

  // Bookmark note
  static async bookmarkNote(
    noteId: string,
    userId: string,
    notes?: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const bookmark: NoteBookmark = {
        id: `bookmark-${Date.now()}`,
        noteId,
        userId,
        bookmarkedAt: new Date(),
        notes,
      };

      await StorageService.appendToArray(this.BOOKMARKS_STORAGE_KEY, bookmark);

      return {
        data: true,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to bookmark note',
        timestamp: new Date(),
      };
    }
  }

  // Get user bookmarks
  static async getUserBookmarks(
    userId: string
  ): Promise<ApiResponse<NoteBookmark[]>> {
    try {
      const allBookmarks = await StorageService.getArray<NoteBookmark>(
        this.BOOKMARKS_STORAGE_KEY
      );
      const userBookmarks = allBookmarks.filter(
        bookmark => bookmark.userId === userId
      );

      return {
        data: userBookmarks,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch bookmarks',
        timestamp: new Date(),
      };
    }
  }

  // Get notes by class session
  static async getNotesByClass(
    classSessionId: string
  ): Promise<ApiResponse<Note[]>> {
    return this.getNotes({ classSessionId });
  }

  // Get notes by subject
  static async getNotesBySubject(
    subject: string
  ): Promise<ApiResponse<Note[]>> {
    return this.getNotes({ subject });
  }

  // Get popular notes
  static async getPopularNotes(
    limit: number = 5
  ): Promise<ApiResponse<Note[]>> {
    try {
      const sortedNotes = [...this.mockNotes]
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, limit);

      return {
        data: sortedNotes,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch popular notes',
        timestamp: new Date(),
      };
    }
  }

  // Get recent notes
  static async getRecentNotes(limit: number = 5): Promise<ApiResponse<Note[]>> {
    try {
      const sortedNotes = [...this.mockNotes]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, limit);

      return {
        data: sortedNotes,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch recent notes',
        timestamp: new Date(),
      };
    }
  }
}
