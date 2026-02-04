export interface ExampleItem {
  id?: number
  title: string
  content?: string | null
  created_at?: string
  updated_at?: string
}

export interface CreateItemRequest {
  title: string
  content?: string
}

export interface UpdateItemRequest {
  title?: string
  content?: string
}
