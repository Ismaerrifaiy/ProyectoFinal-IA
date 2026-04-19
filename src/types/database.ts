export type Profile = {
  id: string
  username: string
  face_descriptor: number[]
  created_at: string
}

type GenericRelationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
        Relationships: GenericRelationship[]
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, unknown>
        Relationships: GenericRelationship[]
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
  }
}
