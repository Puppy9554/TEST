/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CustomFrameTemplate {
  id: string;
  category: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  textLabel: string;
  subLabel?: string;
  stickerStyle?: "hearts" | "stars" | "bubbles" | "flowers" | "minimal";
  layoutType: "4cut-vertical" | "2x2-grid";
}

export interface UseCase {
  id: string;
  title: string;
  description: string;
  sampleText: string;
  sampleSubText: string;
  sampleColors: {
    bg: string;
    text: string;
    border: string;
  };
  sampleSticker: "hearts" | "stars" | "bubbles" | "flowers" | "minimal";
  imageUrl: string;
}

export interface GalleryItem {
  id: string;
  category: "all" | "machine" | "event" | "frame";
  title: string;
  imageUrl: string;
  tag: string;
  ratio: "portrait" | "landscape" | "square";
}

export interface Review {
  id: string;
  rating: number;
  author: string;
  role: string;
  content: string;
  date: string;
  eventTag: string;
}

export interface Inquiry {
  id: string;
  clientName: string;
  phoneNumber: string;
  kakaoId?: string;
  eventDate: string;
  eventLocation: string;
  eventType: string;
  rentalType: "hourly" | "daily";
  rentalDuration: number; // in hours or days
  customFrameText: string;
  specialRequests: string;
  status: "pending" | "confirmed" | "completed";
  createdAt: string;
  estimatedPrice: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}
