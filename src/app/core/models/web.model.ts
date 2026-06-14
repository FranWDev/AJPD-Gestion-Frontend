export interface EditorJSBlock {
  id?: string;
  type: string;
  data: any;
}

export interface EditorJSData {
  time: number;
  blocks: EditorJSBlock[];
  version: string;
}

export interface Publication {
  title: string;
  description: string;
  imageUrl: string;
  createdAt?: string;
  editorContent: EditorJSData;
  oldTitle?: string;
}

export interface HeroImage {
  name: string;
  url: string;
}

export interface SliderSlide {
  name: string;
  url: string;
  caption: string;
}

export interface ImageUploadResponse {
  success: number;
  file: {
    url: string;
    name?: string;
  };
}
