/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Calendar,
  MapPin,
  Clock,
  Check,
  ChevronDown,
  Phone,
  MessageCircle,
  FileText,
  HelpCircle,
  Star,
  ChevronRight,
  Layout,
  Award,
  Download,
  User,
  CheckCircle2,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Volume2,
  BookOpen,
  Sparkles,
  ArrowRight,
  Layers,
  Heart,
  Sparkle
} from "lucide-react";
import { USE_CASES, GALLERY_ITEMS, REVIEWS, FAQS } from "./data";
import { Inquiry, GalleryItem } from "./types";
import InteractiveFrame from "./components/InteractiveFrame";

// Firebase integration Imports
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query 
} from "firebase/firestore";
import { db } from "./lib/firebase";

// Compressed base64 conversion utility for efficient Firestore storage under 1MB document limits
const compressAndConvertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // Downscale to max 850px to fit on any mobile/desktop grid perfectly & stay around ~100kb
        const MAX_DIM = 850;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75); // 75% quality JPEG
          resolve(compressedBase64);
        } else {
          resolve(event.target?.result as string || "");
        }
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default function App() {
  // Navigation states
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Gallery list and filter state
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(GALLERY_ITEMS);
  const [galleryFilter, setGalleryFilter] = useState<"all" | "machine" | "event" | "frame">("all");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>("");

  // Accordion active FAQ
  const [openFAQIndex, setOpenFAQIndex] = useState<string | null>(null);

  // Custom Frame state applied from InteractiveFrame to Booking Calculator
  const [appliedFrameText, setAppliedFrameText] = useState("");
  const [appliedColors, setAppliedColors] = useState({ bg: "#FFFFFF", text: "#1F2937", border: "#E5E7EB" });
  const [isFrameAppliedAlert, setIsFrameAppliedAlert] = useState(false);
  const [appliedLogoText, setAppliedLogoText] = useState("");

  // Admin dynamic variables with LocalStorage state
  const [hourlyPrice, setHourlyPrice] = useState<number>(70000); // 7만원
  const [dailyPrice, setDailyPrice] = useState<number>(350000); // 최대 하루 35만원
  const [companyPhone, setCompanyPhone] = useState<string>("010-1234-5678");
  const [companyEmail, setCompanyEmail] = useState<string>("support@lifemyphotos.com");
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // 추가된 디테일 세세한 실시간 관리자 상태들
  const [allowedRegions, setAllowedRegions] = useState<string>("서울, 경기북부, 세종, 대전, 일산, 고양, 파주, 의정부, 양주, 남양주, 동두천, 연천, 포천");
  const [kakaoUrl, setKakaoUrl] = useState<string>("https://open.kakao.com");
  const [mainSlogan, setMainSlogan] = useState<string>("우리들만의 프라이빗 네컷 사진관 대여 서비스");
  const [dailyDiscountRate, setDailyDiscountRate] = useState<number>(15); // 하루 대여 장기 할인율 (기본 15%)
  const [minimumHourlyDuration, setMinimumHourlyDuration] = useState<number>(3); // 시간제 최소 시간
  const [maximumRentalDays, setMaximumRentalDays] = useState<number>(7); // 하루대여 최대 일수

  // Detailed option prices
  const [woodGuestbookPrice, setWoodGuestbookPrice] = useState<number>(30000);
  const [speakerAmbientPrice, setSpeakerAmbientPrice] = useState<number>(10000);
  const [customFilterPrice, setCustomFilterPrice] = useState<number>(20000);
  const [extraPaperPrice, setExtraPaperPrice] = useState<number>(70000); // 500장 리필 시 7만원 추가요금

  // Admin Gallery Creation form state
  const [newGalleryTitle, setNewGalleryTitle] = useState("");
  const [newGalleryTag, setNewGalleryTag] = useState("");
  const [newGalleryCategory, setNewGalleryCategory] = useState<"machine" | "event" | "frame">("machine");
  const [newGalleryImageUrl, setNewGalleryImageUrl] = useState("");
  const [newGalleryRatio, setNewGalleryRatio] = useState<"portrait" | "landscape" | "square">("portrait");
  
  // Real Upload Local Image States
  const [galleryUploadMode, setGalleryUploadMode] = useState<"url" | "file">("file");
  const [localImageFile, setLocalImageFile] = useState<File | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Secret Admin Lock state using useRef to remain robust against React rendering resets
  const logoClickRef = React.useRef<number>(0);
  const logoClickTimerRef = React.useRef<any>(null);

  // Dynamic Booking / Pricing Calculator state
  const [rentalType, setRentalType] = useState<"hourly" | "daily">("hourly");
  const [durationValue, setDurationValue] = useState<number>(3); // Default 3 hours or 1 day
  const [addWoodGuestbook, setAddWoodGuestbook] = useState(false);
  const [addSpeakerAmbient, setAddSpeakerAmbient] = useState(false);
  const [customFilterSet, setCustomFilterSet] = useState(false);
  const [addPaperRoll, setAddPaperRoll] = useState(false); // 500장 인화용지 추가 롤 충전 옵션 (+7만원)

  // Inquiry form states
  const [clientName, setClientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [kakaoId, setKakaoId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventType, setEventType] = useState("결혼식");
  const [customText, setCustomText] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Submitted inquiry records in localStorage/Firebase
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newlyCreatedInquiry, setNewlyCreatedInquiry] = useState<Inquiry | null>(null);

  // Sync state & indicate Firebase connection status
  const [isFirebaseSynced, setIsFirebaseSynced] = useState(false);

  // Real-time synchronization loader
  useEffect(() => {
    // 1. Synchronize General Settings
    const settingsRef = doc(db, "settings", "system");
    const unsubSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.hourlyPrice !== undefined) setHourlyPrice(Number(data.hourlyPrice));
        if (data.dailyPrice !== undefined) setDailyPrice(Number(data.dailyPrice));
        if (data.companyPhone !== undefined) setCompanyPhone(String(data.companyPhone));
        if (data.companyEmail !== undefined) setCompanyEmail(String(data.companyEmail));
        if (data.allowedRegions !== undefined) setAllowedRegions(String(data.allowedRegions));
        if (data.kakaoUrl !== undefined) setKakaoUrl(String(data.kakaoUrl));
        if (data.mainSlogan !== undefined) setMainSlogan(String(data.mainSlogan));
        if (data.dailyDiscountRate !== undefined) setDailyDiscountRate(Number(data.dailyDiscountRate));
        if (data.minimumHourlyDuration !== undefined) {
          const minVal = Number(data.minimumHourlyDuration);
          setMinimumHourlyDuration(minVal);
          setDurationValue(prev => prev < minVal ? minVal : prev);
        }
        if (data.maximumRentalDays !== undefined) setMaximumRentalDays(Number(data.maximumRentalDays));
        if (data.woodGuestbookPrice !== undefined) setWoodGuestbookPrice(Number(data.woodGuestbookPrice));
        if (data.speakerAmbientPrice !== undefined) setSpeakerAmbientPrice(Number(data.speakerAmbientPrice));
        if (data.customFilterPrice !== undefined) setCustomFilterPrice(Number(data.customFilterPrice));
        if (data.extraPaperPrice !== undefined) setExtraPaperPrice(Number(data.extraPaperPrice));
        setIsFirebaseSynced(true);
      } else {
        // Doc doesn't exist, seed initial default values immediately
        const initialDefaults = {
          hourlyPrice: 70000,
          dailyPrice: 350000,
          companyPhone: "010-1234-5678",
          companyEmail: "support@lifemyphotos.com",
          allowedRegions: "서울, 경기북부, 세종, 대전, 일산, 고양, 파주, 의정부, 양주, 남양주, 동두천, 연천, 포천",
          kakaoUrl: "https://open.kakao.com",
          mainSlogan: "우리들만의 프라이빗 네컷 사진관 대여 서비스",
          dailyDiscountRate: 15,
          minimumHourlyDuration: 3,
          maximumRentalDays: 7,
          woodGuestbookPrice: 30000,
          speakerAmbientPrice: 10000,
          customFilterPrice: 20000,
          extraPaperPrice: 70000
        };
        setDoc(settingsRef, initialDefaults)
          .then(() => setIsFirebaseSynced(true))
          .catch(err => console.error("Error seeding initial settings collection", err));
      }
    }, (error) => {
      console.warn("Firestore settings listen failed (falling back to default parameters):", error);
      // We don't block the screen loading in case of security rules block or network offline
      setIsFirebaseSynced(true);
    });

    // 2. Synchronize Submitted Inquiry Bookings
    const inquiriesColRef = collection(db, "inquiries");
    const unsubInquiries = onSnapshot(inquiriesColRef, (snapshot) => {
      const items: Inquiry[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          clientName: data.clientName || "",
          phoneNumber: data.phoneNumber || "",
          kakaoId: data.kakaoId,
          eventDate: data.eventDate || "",
          eventLocation: data.eventLocation || "",
          eventType: data.eventType || "",
          rentalType: data.rentalType || "hourly",
          rentalDuration: Number(data.rentalDuration || 3),
          customFrameText: data.customFrameText || "",
          specialRequests: data.specialRequests || "",
          status: data.status || "pending",
          createdAt: data.createdAt || "",
          estimatedPrice: Number(data.estimatedPrice || 0)
        });
      });
      // Sort alphabetically by ID descending or created date descending so recent ones go top
      items.sort((a, b) => b.id.localeCompare(a.id));
      setMyInquiries(items);
      localStorage.setItem("life_my_photos_inquiries", JSON.stringify(items));
    }, (error) => {
      console.warn("Firestore inquiries listen failed (falling back to offline localStorage registry):", error);
      const stored = localStorage.getItem("life_my_photos_inquiries");
      if (stored) {
        try {
          setMyInquiries(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse local stored inquiries", e);
        }
      }
    });

    // 3. Synchronize Photo Reference Gallery
    const galleryColRef = collection(db, "gallery");
    const unsubGallery = onSnapshot(galleryColRef, async (snapshot) => {
      if (snapshot.empty) {
        // Empty db collections, let's pre-populate it from default local static GALLERY_ITEMS
        try {
          for (const item of GALLERY_ITEMS) {
            await setDoc(doc(db, "gallery", item.id), {
              title: item.title,
              tag: item.tag,
              category: item.category,
              imageUrl: item.imageUrl,
              ratio: item.ratio || "portrait",
              createdAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error("Failed to seed dynamic gallery items collection", err);
        }
      } else {
        const items: GalleryItem[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
            title: data.title || "",
            tag: data.tag || "",
            category: data.category || "machine",
            imageUrl: data.imageUrl || "",
            ratio: data.ratio || "portrait"
          });
        });
        // Sort items so order of display behaves cleanly
        items.sort((a, b) => b.id.localeCompare(a.id));
        setGalleryItems(items);
      }
    }, (error) => {
      console.warn("Firestore gallery listen failed (falling back to static reference catalog):", error);
      const stored = localStorage.getItem("lmp_gallery_items");
      if (stored) {
        try {
          setGalleryItems(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse local stored gallery items", e);
          setGalleryItems(GALLERY_ITEMS);
        }
      } else {
        setGalleryItems(GALLERY_ITEMS);
      }
    });

    return () => {
      unsubSettings();
      unsubInquiries();
      unsubGallery();
    };
  }, []);

  // Extra URL path router for administrator '/admin' layout login access
  useEffect(() => {
    const curPath = window.location.pathname;
    const curHash = window.location.hash;
    const curSearch = window.location.search;
    
    if (
      curPath.includes("/admin") || 
      curHash.includes("admin") || 
      curSearch.includes("admin")
    ) {
      setTimeout(() => {
        const pass = prompt("🔑 어드민 관제센터에 접속하려면 패스워드를 입력해주세요:");
        if (pass === "3714") {
          setIsAdminMode(true);
          alert("🔓 인증 성공! 세세한 일체 제어 관제센터(어드민)가 활성화되었습니다.");
          try {
            if (window.history && window.history.pushState) {
              window.history.pushState("", document.title, window.location.origin + window.location.pathname);
            }
          } catch (err) {
            console.warn("Could not clean URL history state", err);
          }
        } else {
          alert("❌ 올바른 어드민 패스워드가 아닙니다.");
          try {
            if (window.history && window.history.pushState) {
              window.history.pushState("", document.title, window.location.origin + window.location.pathname);
            }
          } catch (err) {
            console.warn("Could not clean URL history state", err);
          }
        }
      }, 400);
    }
  }, []);

  const saveAdminData = async (h: number, d: number, p: string, m: string) => {
    setHourlyPrice(h);
    setDailyPrice(d);
    setCompanyPhone(p);
    setCompanyEmail(m);
    try {
      await setDoc(doc(db, "settings", "system"), {
        hourlyPrice: h,
        dailyPrice: d,
        companyPhone: p,
        companyEmail: m
      }, { merge: true });
    } catch (err) {
      console.error("Failed to commit standard settings to Firebase", err);
    }
  };

  const saveDetailedAdminData = async (regions: string, kUrl: string, slogan: string, discount: number, minDur: number, maxDays: number) => {
    setAllowedRegions(regions);
    setKakaoUrl(kUrl);
    setMainSlogan(slogan);
    setDailyDiscountRate(discount);
    setMinimumHourlyDuration(minDur);
    setMaximumRentalDays(maxDays);
    try {
      await setDoc(doc(db, "settings", "system"), {
        allowedRegions: regions,
        kakaoUrl: kUrl,
        mainSlogan: slogan,
        dailyDiscountRate: discount,
        minimumHourlyDuration: minDur,
        maximumRentalDays: maxDays
      }, { merge: true });
    } catch (err) {
      console.error("Failed to commit operational settings to Firebase", err);
    }
  };

  const saveOptionPrices = async (wood: number, spk: number, filter: number, extraP: number) => {
    setWoodGuestbookPrice(wood);
    setSpeakerAmbientPrice(spk);
    setCustomFilterPrice(filter);
    setExtraPaperPrice(extraP);
    try {
      await setDoc(doc(db, "settings", "system"), {
        woodGuestbookPrice: wood,
        speakerAmbientPrice: spk,
        customFilterPrice: filter,
        extraPaperPrice: extraP
      }, { merge: true });
    } catch (err) {
      console.error("Failed to commit option rates to Firebase", err);
    }
  };

  // Secret admin access trigger when clicking 5 times on logo
  const handleLogoClick = () => {
    logoClickRef.current += 1;
    
    if (logoClickTimerRef.current) {
      clearTimeout(logoClickTimerRef.current);
    }
    
    logoClickTimerRef.current = setTimeout(() => {
      logoClickRef.current = 0;
    }, 6000); // Increased to 6 seconds to be highly forgiving for slower clickers

    if (logoClickRef.current >= 5) {
      logoClickRef.current = 0;
      if (logoClickTimerRef.current) clearTimeout(logoClickTimerRef.current);
      
      const pass = prompt("🔑 관리자 시스템 보안 패스워드를 입력해주세요:");
      if (pass === "3714") {
        setIsAdminMode(true);
        alert("🔓 인증 성공! 세세한 일체 제어 관제센터(어드민)가 활성화되었습니다.");
      } else if (pass !== null) {
        alert("❌ 올바른 어드민 패스워드가 아닙니다.");
      }
    } else {
      handleScrollToId("hero");
    }
  };

  // Gallery Reference management helpers
  const handleAddGalleryItem = (title: string, tag: string, cat: "machine" | "event" | "frame", url: string, ratio: "portrait" | "landscape" | "square") => {
    const newItem: GalleryItem = {
      id: "GL_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      title,
      tag: tag || "설치 레퍼런스",
      category: cat,
      imageUrl: url,
      ratio
    };
    const updated = [...galleryItems, newItem];
    setGalleryItems(updated);
    localStorage.setItem("lmp_gallery_items", JSON.stringify(updated));
    alert("🖼️ 새로운 설치 포토부스 레퍼런스 갤러리가 추가 등록되었습니다.");
  };

  const handleDeleteGalleryItem = (id: string) => {
    if (confirm("정말로 이 설치 갤러리 레퍼런스를 삭제할까요?")) {
      const updated = galleryItems.filter(x => x.id !== id);
      setGalleryItems(updated);
      localStorage.setItem("lmp_gallery_items", JSON.stringify(updated));
    }
  };

  // Sync state & highlight navigation bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "why", "preview-section", "use-cases", "gallery", "pricing", "faq", "contact"];
      const scrollPos = window.scrollY + 160;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Frame customizer feedback bridging
  const handleApplyFrameToInquiry = (frameText: string, colors: { bg: string; text: string; border: string }, logoText: string) => {
    setAppliedFrameText(frameText);
    setCustomText(frameText);
    setAppliedColors(colors);
    setAppliedLogoText(logoText);
    setIsFrameAppliedAlert(true);
    
    // Scroll smoothly to contact/calculator section
    const el = document.getElementById("contact");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }

    setTimeout(() => {
      setIsFrameAppliedAlert(false);
    }, 4000);
  };

  // Preset Event template applying straight to interactive Frame & prefilling some fields
  const handleApplyPresetTemplate = (useCase: typeof USE_CASES[0]) => {
    setAppliedFrameText(useCase.sampleText);
    setCustomText(useCase.sampleText);
    setEventType(useCase.id === "wedding" ? "결혼식" : useCase.id === "kindergarten" ? "어린이집/유치원" : useCase.id === "church" ? "교회행사" : useCase.id === "campus" ? "학교축제" : useCase.id === "recital" ? "음악회/발표회" : "기업행사");
    
    // Scroll to interactive section
    const el = document.getElementById("preview-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Pricing Estimator logic
  let baseRate = rentalType === "hourly" ? durationValue * hourlyPrice : durationValue * dailyPrice;
  
  // Apply maximum cap: "시간당 7만원이고 최대 하루 35만원이고, 계산기에서 자동으로 시간하다 35만원 이 최대치로 해줘야지"
  if (rentalType === "hourly" && baseRate > dailyPrice) {
    baseRate = dailyPrice;
  }

  // "기획 옵션 추가해보기 (선택) 싹 뺴줘 추가 옵션없어" -> 추가 옵션 금액은 항상 0원
  const woodPrice = 0;
  const speakerPrice = 0;
  const filterPrice = 0;
  const paperPrice = 0;
  
  // Calculate potential bulk discounts
  let discountAmount = 0;
  // 시간 대여는 장기 할인 혜택 없음! 일 단위 3일 이상 대여 시에만 지정된 할인율(dailyDiscountRate) 적용
  if (rentalType === "daily" && durationValue >= 3) {
    discountAmount = Math.floor(baseRate * (dailyDiscountRate / 100));
  }
  const calculatedEstimatedPrice = baseRate + woodPrice + speakerPrice + filterPrice + paperPrice - discountAmount;

  // Submit Inquiry Form
  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !phoneNumber.trim() || !eventDate.trim() || !eventLocation.trim()) {
      alert("신청자 성함, 휴대폰 번호, 행사 날짜, 예약 지역을 적어주세요! 😊");
      return;
    }

    // Regional limit validation: 관리자가 세세히 지정한 allowedRegions 기반 동적 쉼표 구분 체크
    const locationLower = eventLocation.toLowerCase().replace(/\s+/g, "");
    const regionKeywords = allowedRegions
      .split(",")
      .map(r => r.trim().toLowerCase().replace(/\s+/g, ""))
      .filter(Boolean);

    const isAllowedRegion = regionKeywords.some(keyword => locationLower.includes(keyword));

    if (!isAllowedRegion) {
      alert(`⚠️ 배차 및 설치 제한 구역 안내\n\n저희 포토부스 대여 서비스는 현재 등록된 대여 가능 구역인 [${allowedRegions}] 권역에서만 배차 및 현장 설치가 가능합니다.\n그 외 타 지역은 아쉽게도 장비 위탁이나 배치 가이드가 제공되지 않사오니 지역을 꼭 다시 확인 후 접수해주세요! 😢`);
      return;
    }

    const newInquiryId = "INQ_" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newInquiry: Inquiry = {
      id: newInquiryId,
      clientName: clientName.trim(),
      phoneNumber: phoneNumber.trim(),
      kakaoId: kakaoId.trim() || undefined,
      eventDate,
      eventLocation: eventLocation.trim(),
      eventType,
      rentalType,
      rentalDuration: durationValue,
      customFrameText: customText.trim() || appliedFrameText || "나만의 감성 4컷 프레임",
      specialRequests: specialRequests.trim() || (appliedLogoText ? `(로고문구: ${appliedLogoText})` : "없음"),
      status: "pending",
      createdAt: new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      estimatedPrice: calculatedEstimatedPrice
    };

    try {
      // Save directly to raw Firestore inquiries collection
      await setDoc(doc(db, "inquiries", newInquiryId), {
        clientName: newInquiry.clientName,
        phoneNumber: newInquiry.phoneNumber,
        kakaoId: newInquiry.kakaoId || "",
        eventDate: newInquiry.eventDate,
        eventLocation: newInquiry.eventLocation,
        eventType: newInquiry.eventType,
        rentalType: newInquiry.rentalType,
        rentalDuration: newInquiry.rentalDuration,
        customFrameText: newInquiry.customFrameText,
        specialRequests: newInquiry.specialRequests,
        status: newInquiry.status,
        createdAt: newInquiry.createdAt,
        estimatedPrice: newInquiry.estimatedPrice
      });

      setNewlyCreatedInquiry(newInquiry);
      setShowSuccessModal(true);

      // Reset Form fields
      setCustomText("");
      setSpecialRequests("");
    } catch (err) {
      console.warn("Failed to commit inquiry to Firestore (entering secure offline backup mode):", err);
      // Fallback: save to client state and localStorage immediately so request is not lost
      const updated = [newInquiry, ...myInquiries];
      setMyInquiries(updated);
      localStorage.setItem("life_my_photos_inquiries", JSON.stringify(updated));

      setNewlyCreatedInquiry(newInquiry);
      setShowSuccessModal(true);

      // Reset Form fields
      setCustomText("");
      setSpecialRequests("");
    }
  };

  const handleUpdateInquiryStatus = async (id: string, newStatus: "pending" | "confirmed" | "completed") => {
    // Offline / Optimistic Update
    const updated = myInquiries.map((inq) =>
      inq.id === id ? { ...inq, status: newStatus } : inq
    );
    setMyInquiries(updated);
    localStorage.setItem("life_my_photos_inquiries", JSON.stringify(updated));

    try {
      await updateDoc(doc(db, "inquiries", id), { status: newStatus });
    } catch (err) {
      console.warn("Firestore status update failed (saved to local cache):", err);
    }
  };

  // Cancel submitted inquiry
  const handleCancelInquiry = async (id: string) => {
    if (confirm("정말로 상담 신청을 취소할까요? 😢")) {
      // Offline / Optimistic Update
      const updated = myInquiries.filter((x) => x.id !== id);
      setMyInquiries(updated);
      localStorage.setItem("life_my_photos_inquiries", JSON.stringify(updated));

      try {
        await deleteDoc(doc(db, "inquiries", id));
      } catch (err) {
        console.warn("Firestore inquiry deletion failed (removed from local cache):", err);
      }
    }
  };

  // Simple scrolling handler
  const handleScrollToId = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative antialiased bg-[#FAF9F6] text-neutral-800 pb-20 sm:pb-0">
      
      {/* Dynamic Alert Banner for frame bridging */}
      <AnimatePresence>
        {isFrameAppliedAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white text-xs px-6 py-3.5 rounded-full shadow-xl flex items-center gap-2 border border-rose-400 font-bold"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-spin" />
            <span>프레임 설정 문구가 대여 신청서에 슝~ 연동되었습니다!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-rose-100/35 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogoClick}
              className="flex flex-col text-left group cursor-pointer"
              title="LifeMyPhotos 홈 - 비즈니스 데스크는 5회 연속 클릭!"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-[22px] lg:text-[25px] tracking-tighter text-rose-500 group-hover:text-rose-600 transition-colors">
                  LifeMyPhotos
                </span>
                <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-lg font-bold">네컷대여</span>
              </div>
              <span className="text-[9px] text-gray-400 font-mono tracking-wider">셀프포토부스 전문 브랜드</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: "gallery", label: "OUR PORTFOLIO" },
              { id: "why", label: "ADVANTAGES" },
              { id: "reviews", label: "HAPPY FEEDBACK" },
              { id: "preview-section", label: "프레임 커스텀" },
              { id: "pricing", label: "대여 요금 안내" },
              { id: "faq", label: "FAQ" },
              { id: "contact", label: "GET IN TOUCH" },
            ].map((navItem) => (
              <button
                key={navItem.id}
                onClick={() => handleScrollToId(navItem.id)}
                className={`text-xs lg:text-[13px] font-semibold px-2.5 py-2 rounded-xl transition-all cursor-pointer ${
                  activeSection === navItem.id
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-gray-500 hover:text-neutral-900 hover:bg-rose-50/50"
                }`}
              >
                {navItem.label}
              </button>
            ))}
          </nav>

          {/* Action button bar */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href={`tel:${companyPhone}`}
              className="flex items-center gap-1 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-neutral-200"
            >
              <Phone className="w-3.5 h-3.5 text-rose-500" />
              <span>전화문의</span>
            </a>
            <button
              onClick={() => handleScrollToId("preview-section")}
              className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
            >
              나만의 프레임 만들기
            </button>
          </div>

          {/* Mobile hamburger trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => handleScrollToId("preview-section")}
              className="bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-lg text-xs"
            >
              대여 신청
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-gray-700"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#FAF9F6] border-b border-rose-100/30 overflow-hidden shadow-lg"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                {[
                  { id: "hero", label: "홈 (MAIN PAGE)" },
                  { id: "gallery", label: "OUR PORTFOLIO (갤러리)" },
                  { id: "why", label: "LIFEMYPHOTOS ADVANTAGES (장점)" },
                  { id: "reviews", label: "HAPPY FEEDBACK (고객 후기)" },
                  { id: "preview-section", label: "실시간 프레임 커스텀" },
                  { id: "pricing", label: "대여 요금 안내" },
                  { id: "faq", label: "FAQ (자주 묻는 질문)" },
                  { id: "contact", label: "GET IN TOUCH (무료 대여 문의)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleScrollToId(item.id)}
                    className="w-full text-left font-bold text-sm py-3 px-4 rounded-xl text-neutral-600 hover:bg-rose-50/50 hover:text-neutral-950 transition-colors block border-b border-rose-50/10"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="grid grid-cols-2 gap-2 pt-4 px-2">
                  <a
                    href={`tel:${companyPhone}`}
                    className="flex items-center justify-center gap-2 bg-white border py-3 rounded-xl text-xs font-bold text-neutral-800"
                  >
                    <Phone className="w-4 h-4 text-rose-500" /> 무료 전화상담
                  </a>
                  <a
                    href={kakaoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 bg-amber-300 py-3 rounded-xl text-xs font-bold text-neutral-900"
                  >
                    <MessageCircle className="w-4 h-4 fill-current text-amber-950" /> 카톡 실시간방
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Container */}
      <main className="flex-grow">
        
        {/* 1. Hero Section */}
        <section
          id="hero"
          className="relative bg-[#FAF9F6] pt-10 pb-16 sm:py-20 lg:py-28 overflow-hidden flex flex-col justify-center"
        >
          {/* Subtle background graphics */}
          <div className="absolute inset-0 z-0 bg-[radial-gradient(#eedec8_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-40" />
          <div className="absolute top-1/4 right-0 w-80 h-80 bg-rose-100 rounded-full blur-[100px] pointer-events-none -z-10 opacity-60" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Hero text */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
              
              {/* Slogan badge */}
              <button
                onClick={handleLogoClick}
                className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 px-4 py-2 rounded-full cursor-pointer hover:bg-rose-100/50 transition-colors"
                title="5회 연타하면 정밀 비밀 관리데스크 활성"
              >
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-[11px] font-bold text-rose-600 tracking-wider text-left">
                  {mainSlogan}
                </span>
              </button>

              {/* Big Display Title */}
              <div className="space-y-2.5">
                <h1 className="font-sans font-black tracking-tight leading-[1.12]">
                  <span className="block text-rose-400 font-bold text-sm sm:text-base tracking-wider uppercase mb-1">
                    #결혼식 #학교축제 #어린이집 #기업팝업 무제한 대여
                  </span>
                  <span className="block text-3xl sm:text-4xl lg:text-[48px] text-neutral-900 font-black">
                    행사가 더 즐겁고 빛나도록,
                  </span>
                  <span className="block text-3xl sm:text-4xl lg:text-[48px] text-rose-500 font-black mt-1">
                    인생네컷 사진을 선물하세요!
                  </span>
                </h1>
                
                <p className="max-w-2xl mx-auto lg:mx-0 text-sm sm:text-base text-gray-500 leading-relaxed pt-1">
                  결혼식 신부 대기실, 유치원 운동회, 교회 성경캠프, 우리 회사 팝업스토어까지! <strong className="text-gray-800 cursor-pointer underline decoration-dotted decoration-rose-300" onClick={handleLogoClick} title="5회 연속으로 누르면 관리자 락다운 풀기">LifeMyPhotos</strong>가 배송부터 친절한 가이드 설치까지 완벽하게 책임질게요. 하객들의 행복한 모습을 무제한으로 예쁘게 담아보세요.
                </p>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto lg:mx-0 pt-1 text-[11px]">
                <div className="bg-white p-2.5 rounded-xl border border-rose-100/50 text-center shadow-xs">
                  <div className="font-bold text-neutral-800">잠깐 시간제 대여</div>
                  <div className="text-rose-500 font-bold mt-0.5">시간당 {hourlyPrice / 10000}만원</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-rose-100/50 text-center shadow-xs">
                  <div className="font-bold text-neutral-800">알찬 하루종일권</div>
                  <div className="text-rose-500 font-bold mt-0.5">대여료 {dailyPrice / 10000}만원</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-rose-100/50 text-center shadow-xs">
                  <div className="font-bold text-neutral-900">출력 비용</div>
                  <div className="text-emerald-600 font-bold mt-0.5">완전 무제한 무료</div>
                </div>
              </div>

              {/* Major Conversion button */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 pt-2">
                <button
                  onClick={() => handleScrollToId("preview-section")}
                  className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95 animate-pulse"
                >
                  <span>나만의 프레임 만들어보기 🎨</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href={kakaoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto bg-amber-300 hover:bg-amber-400 text-neutral-900 font-bold text-sm px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4.5 h-4.5 fill-current text-amber-950" />
                  <span>실시간 카톡 1:1 상담</span>
                </a>
              </div>

              {/* Slogan text */}
              <p className="text-[11px] text-gray-400 text-center lg:text-left">
                * 별도 인화지 비용 없음 · 1:1 디자이너 맞춤 프레임 대폭 지원 · 경기/서울 당일 방문 설치 대행
              </p>
            </div>

            {/* Hero Right Visual Column - Dynamic Photo Strip Collage */}
            <div className="lg:col-span-5 flex justify-center items-center relative select-none mt-6 lg:mt-0">
              <div className="relative w-full max-w-[280px] aspect-[4/5]">
                {/* Visual Circle Backing */}
                <div className="absolute inset-8 rounded-full bg-rose-50 border border-rose-100 -z-10 animate-pulse" />

                {/* 1st Mockup Photo Strip (Left tilt) */}
                <motion.div
                  initial={{ rotate: -15, y: 40, opacity: 0 }}
                  animate={{ rotate: -10, y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 60 }}
                  className="absolute left-2 top-2 bg-neutral-900 p-2 rounded-lg w-[125px] shadow-xl origin-bottom-left"
                >
                  <div className="space-y-1">
                    <img className="aspect-square object-cover rounded-sm" src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=300" referrerPolicy="no-referrer" />
                    <img className="aspect-square object-cover rounded-sm" src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=300" referrerPolicy="no-referrer" />
                    <img className="aspect-square object-cover rounded-sm" src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=300" referrerPolicy="no-referrer" />
                  </div>
                  <div className="text-center pt-2 text-[8px] font-bold text-white tracking-widest font-serif uppercase">
                    Our Memory ⭐
                  </div>
                </motion.div>

                {/* 2nd Mockup Photo Strip (Right tilt) */}
                <motion.div
                  initial={{ rotate: 15, y: 40, opacity: 0 }}
                  animate={{ rotate: 6, y: -20, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 60 }}
                  className="absolute right-2 top-4 bg-white p-2 rounded-lg w-[125px] shadow-lg border border-rose-100 origin-bottom-right"
                >
                  <div className="space-y-1">
                    <img className="aspect-square object-cover rounded-sm" src="https://images.unsplash.com/photo-1531844251246-9a1bfaae0d76?auto=format&fit=crop&q=80&w=300" referrerPolicy="no-referrer" />
                    <img className="aspect-square object-cover rounded-sm" src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=300" referrerPolicy="no-referrer" />
                    <img className="aspect-square object-cover rounded-sm" src="https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=300" referrerPolicy="no-referrer" />
                  </div>
                  <div className="text-center pt-2 text-[7px] font-bold text-neutral-800 tracking-wider">
                    LOVE SMILE
                  </div>
                </motion.div>

                {/* Floating badge */}
                <div className="absolute -top-6 -right-4 bg-white border border-rose-100 p-2.5 rounded-2xl shadow-lg flex items-center gap-1.5 max-w-[150px]">
                  <span className="text-rose-500 animate-bounce">💖</span>
                  <div className="text-[9px] leading-tight">
                    <div className="font-bold text-neutral-900">당일 완벽 세팅 보장</div>
                    <div className="text-gray-400">설치 및 회수까지 알아서 싹!</div>
                  </div>
                </div>

                <div className="absolute -bottom-4 left-6 bg-rose-500 text-white border border-rose-450 px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold">QR 코드로 동영상 소장</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 2. OUR PORTFOLIO (Photo Booth Installation Reference Gallery) */}
        <section id="gallery" className="py-16 bg-[#FAF9F6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
              <div className="text-center md:text-left">
                <span className="text-[11px] font-bold text-rose-500 tracking-widest block mb-1">
                  OUR PORTFOLIO
                </span>
                <h2 className="font-sans font-black text-2xl sm:text-3xl text-neutral-900 tracking-tight">
                  포토부스 설치 레퍼런스 갤러리
                </h2>
                <p className="text-xs text-gray-400 mt-1.5">
                  실제로 여러 행사 현장에 안전하게 대여 완료된 포토부스의 다양한 실물 전경입니다.
                </p>
              </div>

              {/* Category selector tags */}
              <div className="flex gap-1.5 bg-white/70 p-1 rounded-xl shadow-xs border shrink-0">
                {[
                  { value: "all", label: "모두보기" },
                  { value: "machine", label: "포토 부스 실물" },
                  { value: "event", label: "축제 현장 전경" },
                  { value: "frame", label: "인화 프레임 예시" }
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setGalleryFilter(tab.value as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      galleryFilter === tab.value
                        ? "bg-[#FAF9F6] text-rose-500 font-bold border-rose-100 border shadow-xs"
                        : "text-gray-400 hover:text-gray-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive Masonry / Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryItems.filter((x) => galleryFilter === "all" || x.category === galleryFilter).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setLightboxImage(item.imageUrl);
                    setLightboxTitle(item.title);
                  }}
                  className="group relative bg-white rounded-3xl overflow-hidden border border-rose-50 cursor-pointer shadow-xs hover:shadow-md transition-all"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-103"
                    />
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="bg-rose-50 border border-rose-100 text-rose-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.tag}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-800 tracking-tight mt-1.5">
                        {item.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-0.5 whitespace-nowrap">
                      자세히보기 <ChevronRight className="w-3 h-3 text-rose-500 animate-pulse" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* 3. LIFEMYPHOTOS ADVANTAGES (Brand Strengths Section) */}
        <section id="why" className="py-16 bg-white border-y border-rose-100/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[11px] font-bold text-rose-500 tracking-widest uppercase block mb-1">
                LIFEMYPHOTOS ADVANTAGES
              </span>
              <h2 className="font-sans font-black text-2xl sm:text-3xl text-neutral-900 tracking-tight leading-tight">
                단순한 네컷 기계 대여가 아니에요,<br/>
                <span className="text-rose-500 underline decoration-rose-200 decoration-4 underline-offset-4">잊지 못할 행복한 추억</span>을 빌려드립니다.
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-3 leading-relaxed">
                바쁜 행사날, 준비할 것도 참 많으시죠? 저희는 대여만 해주면 끝나는 것이 아니라, 참여하는 모든 분들이 세상 행복한 미소를 짓고 돌아갈 수 있게 하나부터 열까지 세심하게 관리해 드려요.
              </p>
            </div>

            {/* Key Strengths Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  icon: <Award className="w-5 h-5 text-rose-500" />,
                  title: "합리적이고 정직한 가격",
                  descr: `시간 대여는 ${hourlyPrice / 10000}만 원 딱 끝! 하루 온종일 패키지도 ${dailyPrice / 10000}만 원으로 거품을 쫙 뺐어요. 추가금 요구 걱정 없이 즐겁게 쓰세요!`
                },
                {
                  icon: <Layout className="w-5 h-5 text-rose-500" />,
                  title: "1:1 맞춤 프레임 디자인 무료",
                  descr: "축제 테마나 회사 로고, 커플의 기념일 문구와 원하는 귀여운 캐릭터 소품 세팅까지 디자이너가 예쁘게 커스텀해 얹어 드려요."
                },
                {
                  icon: <Camera className="w-5 h-5 text-rose-500" />,
                  title: "인생네컷 매장 수준 명품 화질",
                  descr: "뿌옇게 번지는 일반 프린터는 절대 놉! 인싸들이 자주 찾는 매장에서 쓰는 정밀 염료 특수 고속 인화기로 지문 없는 고화질을 뽑아냅니다."
                },
                {
                  icon: <Download className="w-5 h-5 text-rose-500" />,
                  title: "폰 원본 & 미동 숏폼 움짤 다운",
                  descr: "인화지에 탑재된 QR 코드만 찍으면 사진 고화질 원본 파일은 기본이고, 깜찍하게 찰찰 움직이는 숏 비디오 움짤까지 소장돼요!"
                }
              ].map((strength, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAF9F6] p-5.5 rounded-2xl border border-rose-50 hover:shadow-lg hover:border-rose-100 transition-all flex flex-col items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                    {strength.icon}
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-gray-900 text-sm sm:text-base">{strength.title}</h3>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{strength.descr}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Banner detailing Delivery service */}
            <div className="mt-10 bg-rose-50/50 rounded-2xl border border-rose-100 p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-3.5 text-left">
                <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold shrink-0">100%</div>
                <div>
                  <h4 className="font-sans text-xs sm:text-sm font-bold text-neutral-900 leading-tight">
                    배송 방문, 정확한 위치 설치, 정상 가동 세팅과 마무리 철수까지 싹 원스톱으로 해드려요!
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                    축제 당일, 약속한 시간 정확히 1시간 전까지 전담 엔지니어가 도착해 기기를 든든하게 장착하고 세팅합니다. 고객님은 즐겁게 웃기만 하세요!
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleScrollToId("contact")}
                className="w-full md:w-auto bg-neutral-900 text-white font-bold text-xs py-2.5 px-5 rounded-xl hover:bg-neutral-800 transition-all shrink-0 cursor-pointer"
              >
                우리 동네 예약 현황 조회
              </button>
            </div>

          </div>
        </section>

        {/* 4. HAPPY FEEDBACK (Customer Reviews Section) */}
        <section id="reviews" className="py-16 bg-[#FAF9F6] border-y border-rose-50/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[11px] font-bold text-rose-500 tracking-widest block mb-1">
                HAPPY FEEDBACK
              </span>
              <h2 className="font-sans font-black text-2.5xl sm:text-3.5xl text-neutral-900 tracking-tight">
                대여해보신 분들이 극찬하는 후기!
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                학부모님, 결혼 준비 신랑신부님, 축제 기획 위원 학생들까지 라이프마이포토를 빌려 소중히 작성해주신 리얼 후기입니다.
              </p>
            </div>

            {/* Review Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {REVIEWS.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white p-6 sm:p-7 rounded-3xl border border-rose-50/50 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 stroke-none shrink-0" />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">만족도 5.0 최고</span>
                    </div>

                    <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-sans">
                      "{rev.content}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-rose-100/30 pt-3.5 text-xs mt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-[11px]">
                        {rev.author.substring(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-neutral-900">{rev.author}</div>
                        <div className="text-[10px] text-gray-400">{rev.role}</div>
                      </div>
                    </div>
                    <span className="bg-white border border-rose-100 text-rose-500 text-[9px] font-bold px-2.5 py-0.5 rounded-lg">
                      {rev.eventTag}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-white border border-rose-100/50 rounded-xl p-3 text-center text-xs text-gray-450 max-w-sm mx-auto">
              🏆 자체 대여 만족 조사에서 평점 <span className="font-bold text-rose-500">99.2%</span>를 굳건히 기록 중입니다!
            </div>

          </div>
        </section>

        {/* 5. 실시간 4X6인치 가로 세로형 프레임 커스텀 (Interactive Customizer Frame Section) */}
        <section id="preview-section" className="py-16 bg-white border-y border-rose-100/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[11px] font-bold text-rose-500 tracking-widest block mb-1">
                TRY IT YOURSELF
              </span>
              <h2 className="font-sans font-black text-2.5xl sm:text-3.5xl text-neutral-900 tracking-tight">
                실시간 4X6인치 가로 세로형 프레임 커스텀
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                행사 하객들이 사진을 찍었을 때, 밑에 박힐 문구와 테마 무드 컬러를 입맛따라 실시간으로 재미나게 디자인해보세요!
              </p>
            </div>

            {/* Embedded customizer */}
            <InteractiveFrame onApplyToInquiry={handleApplyFrameToInquiry} />
          </div>
        </section>

        {/* 7. Rent Fee & Calculator Section */}
        <section id="pricing" className="py-16 bg-[#FAF9F6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[11px] font-bold text-rose-500 tracking-widest block mb-1">
                대여 요금 안내
              </span>
              <h2 className="font-sans font-black text-2.5xl sm:text-3.5xl text-neutral-900 tracking-tight">
                추가금 없는 투명하고 투명한 요금 테이블
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                대여료 이외에 사진 인화 장수 추가 비용 등 뒷머리 아픈 청구는 절대 일절 존재하지 않습니다.
              </p>
            </div>

            {/* Standard Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
              
              {/* Plan 1: Hourly */}
              <div className="bg-white rounded-3xl border border-rose-50 p-6 sm:p-7 flex flex-col justify-between hover:border-rose-300 transition-all shadow-xs">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-rose-500 block bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">
                      시간 대여용
                    </span>
                    <span className="text-[11px] text-gray-400">최소 3시간부터 예약 가능</span>
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-lg sm:text-xl text-neutral-900">똑똑한 시간제 대여</h3>
                    <p className="text-xs text-gray-450 mt-1">예배 후 야외 행사나 연주회 피로연 등 짧은 핵심 행사에 딱 좋아요</p>
                  </div>
                  <div className="flex items-baseline gap-1 py-1">
                    <span className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight">시간당 {hourlyPrice.toLocaleString()}</span>
                    <span className="text-xs font-bold text-gray-400">원</span>
                  </div>
                  <ul className="text-xs space-y-2 border-t border-dashed border-rose-100/30 pt-3.5 text-gray-400">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>원하는 디자인 4컷 프레임 전부 무료 커스터마이징</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>안심 배송 방문 및 완전 회수 전적으로 수고해 드려요</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>사진 촬영 및 무제한 인화 완전 무료</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setRentalType("hourly");
                    setDurationValue(3);
                    handleScrollToId("contact");
                  }}
                  className="w-full mt-6 bg-rose-50 hover:bg-rose-100/75 text-rose-600 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
                >
                  시간제 대여 신청하러 가기 &rarr;
                </button>
              </div>

              {/* Plan 2: Daily */}
              <div className="bg-white rounded-3xl border-2 border-rose-500 p-6 sm:p-7 flex flex-col justify-between shadow-lg relative">
                
                {/* Hot Tag */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" /> 가장 많은 선택 패키지
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] font-extrabold text-neutral-900 block bg-amber-200 px-2.5 py-1 rounded-lg">
                      하루 종일권
                    </span>
                    <span className="text-[11px] text-rose-500 font-bold">1일 종일권 최저가</span>
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-lg sm:text-xl text-neutral-900">하루 온종일 패키지</h3>
                    <p className="text-xs text-gray-450 mt-1">결혼식 하객이벤트, 대학교 축제, 대형 팝업까지 아침부터 저녁까지 든든하게!</p>
                  </div>
                  <div className="flex items-baseline gap-1 py-1">
                    <span className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight">하루 {dailyPrice.toLocaleString()}</span>
                    <span className="text-xs font-bold text-gray-400">원</span>
                  </div>
                  <ul className="text-xs space-y-2 border-t border-dashed border-rose-100/30 pt-3.5 text-gray-400">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-neutral-800 font-bold">시간 요금 대수 장기 대여 대비 최대 40% 이상 저렴</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>스마트폰 QR 숏폼 동영상 모바일 소장 무상 지원</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>원하는 로고, 날짜, 문구 배치 무료 시안 제작</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>다수 기기 렌탈 시 추가 우대 제휴 혜택 대기</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setRentalType("daily");
                    setDurationValue(1);
                    handleScrollToId("contact");
                  }}
                  className="w-full mt-6 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-3.5 rounded-xl transition-all cursor-pointer text-center"
                >
                  하루 종일권 알뜰 대여하기 &rarr;
                </button>
              </div>

            </div>

            {/* Smart Pricing Estimator Slide Calculator */}
            <div className="max-w-xl mx-auto bg-white p-5 sm:p-7 rounded-3xl border border-rose-50 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" />
                <h3 className="font-sans font-bold text-sm sm:text-base text-neutral-900">간단 금액 계산기 🧮</h3>
              </div>
              <p className="text-[11.5px] text-gray-400 -mt-2">시간을 조절하여 실시간으로 예상 견적을 즉시 연산해봐요.</p>

              {/* Selector */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => { 
                    setRentalType("hourly"); 
                    setDurationValue(prev => prev < minimumHourlyDuration ? minimumHourlyDuration : (prev > 12 ? 12 : prev)); 
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                    rentalType === "hourly"
                      ? "bg-rose-500 border-rose-500 text-white shadow-xs"
                      : "bg-[#FAF9F6] border-gray-100 text-gray-400 hover:bg-neutral-50"
                  }`}
                >
                  시간제 대여 (시간당 {hourlyPrice / 10000}만원)
                </button>
                <button
                  onClick={() => { 
                    setRentalType("daily"); 
                    setDurationValue(prev => prev > maximumRentalDays ? maximumRentalDays : prev); 
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                    rentalType === "daily"
                      ? "bg-rose-500 border-rose-500 text-white shadow-xs"
                      : "bg-[#FAF9F6] border-gray-100 text-gray-400 hover:bg-neutral-50"
                  }`}
                >
                  하루 대여 (하루당 {dailyPrice / 10000}만원)
                </button>
              </div>

              {/* Slider Input */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs sm:text-sm font-sans">
                  <span className="font-bold text-gray-500">대여 기간 조율</span>
                  <span className="font-bold text-rose-500 text-base">
                    {rentalType === "hourly" ? `${durationValue} 시간 대여` : `${durationValue} 일간 대여`}
                  </span>
                </div>
                <input
                  type="range"
                  min={rentalType === "hourly" ? minimumHourlyDuration : 1}
                  max={rentalType === "hourly" ? 12 : maximumRentalDays}
                  value={durationValue}
                  onChange={(e) => setDurationValue(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#FAF9F6] rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                  {rentalType === "hourly" ? (
                    <>
                      <span>최소 약정 {minimumHourlyDuration}시간</span>
                      <span>6시간</span>
                      <span>최대 추천 12시간</span>
                    </>
                  ) : (
                    <>
                      <span>기본 1일 대여</span>
                      <span>3일 장기 ({dailyDiscountRate}% 즉시 할인)</span>
                      <span>최장 {maximumRentalDays}일</span>
                    </>
                  )}
                </div>
              </div>

              {/* Dynamic Quote total */}
              <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-rose-50/50 flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-center sm:text-left">
                  <span className="text-[9px] text-[#A87343] block font-bold">★ 시간 요금 상한선 하루 최대 {dailyPrice.toLocaleString()}원 자동 적용!</span>
                  <div className="text-xs sm:text-sm font-bold text-neutral-800 mt-0.5">실시간 대여 예상 금액</div>
                </div>
                <div className="text-right">
                  {rentalType === "daily" && durationValue >= 3 && (
                    <span className="text-[9.5px] bg-rose-50 text-rose-500 px-2 py-0.5 rounded font-bold mr-1 block sm:inline-block animate-pulse">
                      장기 {dailyDiscountRate}% 대폭할인 반영!
                    </span>
                  )}
                  <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-rose-500">
                    ₩ {calculatedEstimatedPrice.toLocaleString()}원
                  </span>
                </div>
              </div>

              {/* Auto bridge from calc to inquiry */}
              <button
                onClick={() => {
                  setRentalType(rentalType);
                  const targetMsg = `[간편계산 대여연동]\n유형: ${rentalType === "hourly" ? "시간제" : "1일권"}\n기간: ${durationValue}${rentalType === "hourly" ? "시간" : "일"}\n총 견적: ₩${calculatedEstimatedPrice.toLocaleString()}원`;
                  setSpecialRequests(targetMsg);
                  handleScrollToId("contact");
                  alert("계산하신 조건이 아래 문의신청란에 자동으로 쏙 담겼습니다! 상담신청서를 작성해주세요. ❤️");
                }}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs py-3.5 px-4 rounded-xl cursor-pointer text-center shadow-xs transition-all"
              >
                이 옵션 그대로 대여 상담 폼 완성하기 👉
              </button>

            </div>

          </div>
        </section>

        {/* 8. FAQ Accordions */}
        <section id="faq" className="py-16 bg-white border-y border-rose-50/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[11px] font-bold text-rose-500 tracking-widest block mb-1">
                FAQ
              </span>
              <h2 className="font-sans font-black text-2.5xl sm:text-3.5xl text-neutral-900 tracking-tight">
                대여할 때 자주 하시는 질문 모음!
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                포토부스 공간 보증이나 기계 조작 및 인화 관련해서 미리 정독해보세요.
              </p>
            </div>

            {/* Accordion List */}
            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFAQIndex === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="bg-[#FAF9F6] rounded-2xl border border-rose-50/50 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFAQIndex(isOpen ? null : faq.id)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 text-neutral-800 font-bold text-sm sm:text-base cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{faq.question}</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-rose-450 shrink-0 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden bg-white/70"
                        >
                          <div className="px-5 pb-5 pt-1.5 text-xs sm:text-sm text-neutral-500 leading-relaxed border-t border-rose-50/50">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center text-xs text-gray-400">
              추가 서류 전송(카달로그, 세금계산서)이나 협의가 필요한가요?{" "}
              <a href={`tel:${companyPhone}`} className="text-rose-500 font-bold underline">
                대여 전문 상담팀 ({companyPhone})
              </a>{" "}
              으로 편히 문자나 연락주시면 기쁘게 도와드려요!
            </div>

          </div>
        </section>

        {/* 9. Inquiry Booking Section */}
        <section id="contact" className="py-16 bg-[#FAF9F6] relative">
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-[11px] font-bold text-rose-500 tracking-widest block mb-1">
                    GET IN TOUCH
                  </span>
                  <h2 className="font-sans font-black text-2.5xl sm:text-3.5xl text-neutral-900 tracking-tight leading-none">
                    무료 대여 문의 남기기
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2.5 leading-relaxed">
                    희망하시는 날짜와 장소를 성함과 함께 간편하게 적어주세요! 담당 매니저가 연락드려 예약 가능 시간을 바로 조회해 드립니다.
                  </p>
                </div>

                {/* Direct quick call card */}
                <div className="bg-neutral-900 text-white p-5 rounded-2xl flex items-center gap-4 shadow-lg border border-neutral-800">
                  <div className="w-10 h-10 rounded-full bg-[#1F2937] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-amber-300 animate-bounce" />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-gray-400 uppercase">FAST DIRECT TEL</div>
                    <div className="text-base sm:text-lg font-bold tracking-tight text-white">{companyPhone}</div>
                    <div className="text-[9.5px] text-gray-400">친절한 실시간 상담원 대기 (연중무휴)</div>
                  </div>
                </div>

                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 flex items-start gap-2 text-xs text-rose-650">
                  <span className="text-base">📅</span>
                  <div>
                    <span className="font-bold">가을/초겨울 결혼 성수기 대여 조기 마감 임박!</span>
                    <p className="text-[11px] text-rose-500 mt-0.5">원하시는 날짜 기계 배치를 원하시면, 미리 한 달 전에 가예약을 권해드립니다.</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Inquiry Form */}
              <div className="lg:col-span-7 bg-white p-5 sm:p-7.5 rounded-3xl border border-rose-50/50 shadow-sm">
                
                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1">성함 또는 단체명 *</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="예: 김지선, 파람초등학교"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-rose-500 text-gray-800 bg-[#FAF9F6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1">휴대폰 연락처 *</label>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="예: 010-1234-5678"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-rose-500 text-gray-800 bg-[#FAF9F6]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1">카톡 ID (시안 수정 소통용)</label>
                      <input
                        type="text"
                        value={kakaoId}
                        onChange={(e) => setKakaoId(e.target.value)}
                        placeholder="선택 사항"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-rose-500 text-gray-800 bg-[#FAF9F6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1">행사 예정 날짜 *</label>
                      <input
                        type="date"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-rose-500 text-gray-500 bg-[#FAF9F6]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 mb-1">
                        행사 예약 장소 / 동네 * 
                        <span className="text-[10px] text-rose-500 ml-1 font-normal">(서울/경기북부, 세종/대전만 가능)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        placeholder="예시: 서울 강남구 또는 고양시 일산서구"
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-rose-500 text-gray-800 bg-[#FAF9F6]"
                      />
                    </div>
                  </div>

                  {/* Preset string or custom copy */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">사진 아래 찍힐 기본 커스텀 문구 (선택)</label>
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="예시: 지호랑 유나랑 백년해로 한 날"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-rose-500 text-gray-800 bg-[#FAF9F6]"
                    />
                  </div>

                  {/* Combined message or notes from slider calculator */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">기타 문의 및 요구 사항</label>
                    <textarea
                      rows={3}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="시작 희망하는 시각, 주정차 가능 조건 등 편하게 남겨주세요."
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-rose-500 text-gray-800 bg-[#FAF9F6] resize-none font-sans"
                    />
                  </div>

                  <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-50/50 text-[10px] text-gray-400 flex items-start gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>개인정보(이름과 전화번호 등)는 오직 예약 매니저가 상담 일정을 확인하고 제약 없이 회수하는 용도로만 안전하게 활용되고 7일 복무 후 철저하게 파기됩니다.</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm py-3.5 rounded-xl cursor-pointer transition-transform transform active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> <span>대여 상담 신청서 전송하기</span>
                  </button>
                </form>

              </div>

            </div>

            {/* MY LOCAL RESERVATIONS LISTINGS */}
            {myInquiries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 bg-white p-5 sm:p-7 rounded-3xl border border-rose-50/50 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-center bg-rose-50/30 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-sans font-bold text-xs sm:text-sm text-neutral-900">내가 신청한 상담 내역 (실제 브라우저 즉시 확인용)</h3>
                  </div>
                  <span className="text-[10px] text-gray-400">삭제 가능</span>
                </div>
                
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-rose-100/50 bg-[#FAF9F6] text-gray-400">
                        <th className="p-3 font-semibold">접수 ID</th>
                        <th className="p-3 font-semibold">성함/단체명</th>
                        <th className="p-3 font-semibold">행사 예정날</th>
                        <th className="p-3 font-semibold">대여 형태</th>
                        <th className="p-3 font-semibold">가산 견적액</th>
                        <th className="p-3 text-center font-semibold">처리 무대 상태</th>
                        <th className="p-3 text-center font-semibold">취소</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-neutral-600">
                      {myInquiries.map((myInq) => (
                        <tr key={myInq.id} className="hover:bg-[#FAF9F6]/50">
                          <td className="p-3 font-bold text-rose-500">{myInq.id}</td>
                          <td className="p-3">{myInq.clientName}</td>
                          <td className="p-3 font-serif">{myInq.eventDate}</td>
                          <td className="p-3">
                            <span className="bg-rose-50 text-rose-500 border border-rose-100 px-2 py-0.5 rounded text-[10px] font-bold">
                              {myInq.eventType} ({myInq.rentalDuration}{myInq.rentalType === "hourly" ? "시간" : "일"})
                            </span>
                          </td>
                          <td className="p-3 font-black text-neutral-800">₩{myInq.estimatedPrice.toLocaleString()}원</td>
                          <td className="p-3 text-center">
                            {myInq.status === "pending" && (
                              <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-lg text-[10px] font-bold animate-pulse">
                                💌 상담팀 긴급 확인중
                              </span>
                            )}
                            {myInq.status === "confirmed" && (
                              <span className="bg-emerald-50 text-emerald-750 border border-emerald-100 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                🟢 예약 배차 확정
                              </span>
                            )}
                            {myInq.status === "completed" && (
                              <span className="bg-purple-50 text-purple-750 border border-purple-100 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                🟣 1:1 상담 통화 완료
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleCancelInquiry(myInq.id)}
                              className="text-red-400 hover:text-red-600 font-bold hover:underline"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

          </div>
        </section>

      </main>

      {/* Floating Action Quick Bar (Bottom on Mobile) */}
      <div
        id="quick-mobile-action-bar"
        className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-neutral-900/90 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-neutral-800 flex items-center justify-between"
      >
        <div className="flex flex-col text-left">
          <span className="text-[9px] text-[#A7F3D0] font-bold leading-none">LIFEMYPHOTOS</span>
          <span className="text-xs font-bold text-white mt-1 leading-none">실시간 예약 배차 상담</span>
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href="https://open.kakao.com"
            target="_blank"
            rel="noreferrer"
            className="bg-amber-300 text-neutral-900 p-2 rounded-xl font-bold flex items-center justify-center text-[11px] gap-1"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current text-amber-950" />
            <span>카톡</span>
          </a>
          <a
            href={`tel:${companyPhone}`}
            className="bg-[#1F2937] text-white p-2 rounded-xl font-bold flex items-center justify-center text-[11px] gap-1"
          >
            <Phone className="w-3.5 h-3.5 text-rose-450" />
            <span>전화</span>
          </a>
          <button
            onClick={() => handleScrollToId("contact")}
            className="bg-rose-500 text-white p-2 rounded-xl font-bold text-[11px]"
          >
            상담신청
          </button>
        </div>
      </div>

      {/* Modern Lightbox Modal for gallery viewing */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FAF9F6] rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative cursor-default"
            >
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={lightboxImage}
                alt="Reference"
                referrerPolicy="no-referrer"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="p-5 space-y-1.5">
                <span className="bg-rose-50 border border-rose-100 text-rose-500 text-[9.5px] font-bold px-2 py-0.5 rounded-md">
                  실제 대여 고객 인화 뷰어
                </span>
                <h4 className="text-sm font-bold text-neutral-800 tracking-tight">
                  {lightboxTitle}
                </h4>
                <p className="text-xs text-gray-400">
                  * 라이프마이포토는 실제 번화가에 위치한 전용 셀프 매장에서 쓰는 인쇄 장비와 부드러운 매트 용지를 기본 세팅하므로, 물방울이나 햇빛에도 변함 없는 완벽한 보관력을 자랑합니다.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Admin Panel Dashboard Overlay */}
      <AnimatePresence>
        {isAdminMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-rose-100 overflow-hidden flex flex-col my-8"
            >
              {/* Admin Header */}
              <div className="bg-neutral-950 text-white p-5 sm:p-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">⚙️</span>
                  <div>
                    <h3 className="font-sans font-black text-sm sm:text-base tracking-tight">LifeMyPhotos 비즈니스 어드민 관제 데스크</h3>
                    <p className="text-[9px] text-gray-405 font-mono uppercase tracking-widest mt-0.5">Real-time local admin synchronization module</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdminMode(false)}
                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  닫기 ✕
                </button>
              </div>

              {/* Admin Body Panels */}
              <div className="p-6 overflow-y-auto space-y-6 max-h-[70vh] custom-scrollbar text-gray-805">
                {/* 1. Global site settings pricing/etc */}
                <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-rose-100/50 space-y-4">
                  <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚙️</span> 사이트 디테일 관제 & 전역 운영 정책 설정 (초정밀 모드)
                  </h4>

                  {/* Row 1: Core Financials & Support */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">시간당 대여 요금 (원화)</label>
                      <input
                        type="number"
                        step={1000}
                        value={hourlyPrice}
                        onChange={(e) => setHourlyPrice(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">하루종일 기본요금 (원화)</label>
                      <input
                        type="number"
                        step={1000}
                        value={dailyPrice}
                        onChange={(e) => setDailyPrice(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">고객센터 대표전화번호</label>
                      <input
                        type="text"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">대표 이메일 주소</label>
                      <input
                        type="text"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Row 2: Advanced Business Rules */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 border-t border-rose-100/20">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-neutral-600 mb-0.5">
                        배역 제한 구역 동키워드 필터 설정 (쉼표 구분)
                      </label>
                      <span className="block text-[8.5px] text-gray-400 mb-1">
                        여기에 적힌 키워드가 포함될 때만 대여 폼 신청이 통과됩니다.
                      </span>
                      <input
                        type="text"
                        value={allowedRegions}
                        onChange={(e) => setAllowedRegions(e.target.value)}
                        placeholder="서울, 경기북부, 대전, 세종 등을 입력"
                        className="w-full px-2.5 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-bold"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-neutral-600 mb-0.5">
                        공식 실시간 카카오톡 링크 주소
                      </label>
                      <span className="block text-[8.5px] text-gray-400 mb-1">
                        모든 '카톡 실시간 실시간 무료상담' 버튼 클릭시 새 탭 이동할 목적지 링크
                      </span>
                      <input
                        type="text"
                        value={kakaoUrl}
                        onChange={(e) => setKakaoUrl(e.target.value)}
                        placeholder="https://open.kakao.com/o/..."
                        className="w-full px-2.5 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Row 3: Display Slogan & Custom Pricing Caps */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 border-t border-rose-100/20">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">
                        메인 Hero 대문 슬로건 문구 (배지)
                      </label>
                      <input
                        type="text"
                        value={mainSlogan}
                        onChange={(e) => setMainSlogan(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">
                        하루 대여 장기 할인율 (% 단위)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={dailyDiscountRate}
                        onChange={(e) => setDailyDiscountRate(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-600 mb-1" title="시간 대여의 하한 조절">
                          시간제 최소단위
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={minimumHourlyDuration}
                          onChange={(e) => setMinimumHourlyDuration(parseInt(e.target.value) || 3)}
                          className="w-full px-2 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-600 mb-1" title="하루 대여의 최대 조절">
                          하루제 최대단위
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={maximumRentalDays}
                          onChange={(e) => setMaximumRentalDays(parseInt(e.target.value) || 7)}
                          className="w-full px-2 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Option Rates (Wood, Speaker, Filter, Extra Paper) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-rose-100/20">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">우드 방명록 옵션가 (원)</label>
                      <input
                        type="number"
                        step={1000}
                        value={woodGuestbookPrice}
                        onChange={(e) => setWoodGuestbookPrice(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">스피커 앰비언트 옵션가 (원)</label>
                      <input
                        type="number"
                        step={1000}
                        value={speakerAmbientPrice}
                        onChange={(e) => setSpeakerAmbientPrice(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">디자이너 커스텀필터가 (원)</label>
                      <input
                        type="number"
                        step={1000}
                        value={customFilterPrice}
                        onChange={(e) => setCustomFilterPrice(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">인화지 다량 추가롤 가격 (원)</label>
                      <input
                        type="number"
                        step={1000}
                        value={extraPaperPrice}
                        onChange={(e) => setExtraPaperPrice(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs text-neutral-850 border rounded-lg bg-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-dashed border-rose-100/30">
                    <span className="text-[9.5px] text-rose-450 leading-relaxed max-w-xl">
                      💡 <strong>전체 저장동기화</strong>를 누르면, 가격 테이블, 부가 품목 옵션 가격, 계산기 최대 최솟값, 카톡 오픈 상담 링크, 슬로건 배지가 파이어베이스 및 로컬 화면에 일괄 바인딩됩니다.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        saveAdminData(hourlyPrice, dailyPrice, companyPhone, companyEmail);
                        saveDetailedAdminData(allowedRegions, kakaoUrl, mainSlogan, dailyDiscountRate, minimumHourlyDuration, maximumRentalDays);
                        saveOptionPrices(woodGuestbookPrice, speakerAmbientPrice, customFilterPrice, extraPaperPrice);
                        alert("✨ 축하합니다! 모든 상세 가격 및 부가품목 옵션, 밸리데이션 정책이 로컬 & 클라우드 스토리지에 실시간 영구 동기화 저장되었습니다! 😊");
                      }}
                      className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs py-2 px-6 rounded-xl cursor-pointer shadow-md transition-all active:scale-95 text-center"
                    >
                      전체 세세 설정 저장동기화 💾
                    </button>
                  </div>
                </div>

                {/* 1.5 Real-time Advanced Business Stats Panel */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📊</span> 실시간 예약 자산 지표 & 매출 대시보드
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-rose-500 text-white p-4.5 rounded-2.5xl flex flex-col justify-between shadow-xs border border-rose-450">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">전체 누적 대여 문의</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-2.5xl font-sans font-black">{myInquiries.length}</span>
                        <span className="text-[10px] font-bold">건 접수 완료</span>
                      </div>
                    </div>
                    <div className="bg-[#FAF9F6] border border-emerald-100 p-4.5 rounded-2.5xl flex flex-col justify-between shadow-xs text-neutral-800">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">확정 대여 건수</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-2.5xl font-sans font-black text-emerald-600">{myInquiries.filter(x => x.status === "confirmed").length}</span>
                        <span className="text-[10px] font-bold text-emerald-500">건 배차 세팅완료</span>
                      </div>
                    </div>
                    <div className="bg-[#FAF9F6] border border-amber-100 p-4.5 rounded-2.5xl flex flex-col justify-between shadow-xs text-neutral-800">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">상담대기 중 접수</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-2.5xl font-sans font-black text-amber-600">{myInquiries.filter(x => x.status === "pending").length}</span>
                        <span className="text-[10px] font-bold text-amber-500">건 실시간 대응대기</span>
                      </div>
                    </div>
                    <div className="bg-neutral-900 text-white p-4.5 rounded-2.5xl flex flex-col justify-between shadow-xs border border-neutral-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-95 text-rose-300">추정 활성 매출 (취소 제외)</span>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <span className="text-lg font-sans font-black text-white">₩{myInquiries.filter(x => x.status !== "cancelled").reduce((acc, current) => acc + (current.estimatedPrice || 0), 0).toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-rose-300">공급예정</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Registered inquiries list */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <h4 className="text-xs font-black text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📬</span> 실시간 대여 접수 현황 & 예약 매니징 ({myInquiries.length}건)
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        상담 상태 변경 시 고객 배지도 자동 연동됩니다!
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(myInquiries, null, 2));
                            const downloadAnchor = document.createElement('a');
                            downloadAnchor.setAttribute("href", dataStr);
                            downloadAnchor.setAttribute("download", `lifemyphotos_inquiries_backup_${new Date().toISOString().slice(0,10)}.json`);
                            document.body.appendChild(downloadAnchor);
                            downloadAnchor.click();
                            downloadAnchor.remove();
                          } catch (err) {
                            alert("백업 파일 내보내기 중 문제가 발생했습니다.");
                          }
                        }}
                        className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        📥 백업 받기 (.json)
                      </button>
                    </div>
                  </div>

                  {myInquiries.length === 0 ? (
                    <div className="text-center py-10 bg-neutral-50 rounded-2xl border text-xs text-gray-450 leading-relaxed">
                      아직 접수된 대여 신청 건이 존재하지 않습니다.<br/>상단 폼이나 계산기 연동 버튼으로 직접 예약 문의를 접수해 보세요!
                    </div>
                  ) : (
                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-neutral-50 border-b text-gray-500 font-semibold font-mono">
                              <th className="p-3 font-semibold">신청 건 ID</th>
                              <th className="p-3 font-semibold">성함 / 연락처</th>
                              <th className="p-3 font-semibold">축제종류 / 지역</th>
                              <th className="p-3 font-semibold">프레임 시안글</th>
                              <th className="p-3 font-semibold">임시 견적액</th>
                              <th className="p-3 text-center font-semibold">비즈니스 상태 업데이트</th>
                              <th className="p-3 text-center font-semibold">동기 완전삭제</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-neutral-700">
                            {myInquiries.map((inq) => (
                              <tr key={inq.id} className="hover:bg-neutral-50/55 transition-colors">
                                <td className="p-3 font-mono font-bold text-rose-500">{inq.id}</td>
                                <td className="p-3">
                                  <div className="font-bold">{inq.clientName}</div>
                                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">{inq.phoneNumber}</div>
                                </td>
                                <td className="p-3">
                                  <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-neutral-600 mr-1 block sm:inline-block">
                                    {inq.eventType}
                                  </span>
                                  <span className="text-gray-450 text-[10px] sm:ml-0.5">{inq.eventLocation}</span>
                                </td>
                                <td className="p-3">
                                  <div className="truncate max-w-[120px] font-serif italic text-rose-950 font-bold" title={inq.customFrameText}>
                                    "{inq.customFrameText}"
                                  </div>
                                </td>
                                <td className="p-3 font-black text-neutral-900">₩{inq.estimatedPrice.toLocaleString()}원</td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateInquiryStatus(inq.id, "pending")}
                                      className={`px-1.5 py-1 rounded text-[9px] font-bold transition-all cursor-pointer ${
                                        inq.status === "pending"
                                          ? "bg-rose-500 text-white"
                                          : "bg-gray-100 hover:bg-gray-200 text-gray-400"
                                      }`}
                                    >
                                      접수대기
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateInquiryStatus(inq.id, "confirmed")}
                                      className={`px-1.5 py-1 rounded text-[9px] font-bold transition-all cursor-pointer ${
                                        inq.status === "confirmed"
                                          ? "bg-emerald-500 text-white"
                                          : "bg-gray-100 hover:bg-gray-200 text-gray-400"
                                      }`}
                                    >
                                      예약확정
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateInquiryStatus(inq.id, "completed")}
                                      className={`px-1.5 py-1 rounded text-[9px] font-bold transition-all cursor-pointer ${
                                        inq.status === "completed"
                                          ? "bg-purple-500 text-white"
                                          : "bg-gray-100 hover:bg-gray-200 text-gray-400"
                                      }`}
                                    >
                                      상담통화
                                    </button>
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleCancelInquiry(inq.id)}
                                    className="text-red-500 hover:text-red-700 font-bold text-xs cursor-pointer"
                                  >
                                    ✕ 제거
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Reference Gallery Portfolio Asset Management */}
                <div className="space-y-4 border-t border-dashed border-rose-100/30 pt-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5 text-neutral-700">
                      <span>📸</span> 현장 설치 레퍼런스 & 추천 갤러리 통합 편집기 ({galleryItems.length}개 노출)
                    </h4>
                    <span className="text-[10px] text-rose-500 bg-rose-50 px-2.5 py-1 rounded font-bold border border-rose-100">
                      어드민에서 추가한 레퍼런스는 실시간 메인화면의 '사진 갤러리'에 즉시 등재됩니다!
                    </span>
                  </div>

                  {/* Add New Gallery Item Form Console */}
                  <div className="bg-white p-4 rounded-2xl border border-rose-50 shadow-xs space-y-3">
                    <span className="block text-[11px] font-extrabold text-neutral-800">✙ 새 미디어 레퍼런스 현장 기록 추가</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-400 mb-1">참가 행사 타이틀 / 장소명</label>
                        <input
                          type="text"
                          value={newGalleryTitle}
                          onChange={(e) => setNewGalleryTitle(e.target.value)}
                          placeholder="의정부 민락어린이집 운동회"
                          className="w-full px-2.5 py-1.5 text-xs text-neutral-800 border rounded-lg focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-400 mb-1">대표 설명 글귀 / 태그명</label>
                        <input
                          type="text"
                          value={newGalleryTag}
                          onChange={(e) => setNewGalleryTag(e.target.value)}
                          placeholder="어린이집 250장 인화"
                          className="w-full px-2.5 py-1.5 text-xs text-neutral-800 border rounded-lg focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-400 mb-1">전시 분류 카테고리</label>
                        <select
                          value={newGalleryCategory}
                          onChange={(e) => setNewGalleryCategory(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 text-xs text-neutral-800 border rounded-lg focus:outline-none focus:border-rose-500 bg-white"
                        >
                          <option value="machine">기계 설치 사진 (포토부스 본체)</option>
                          <option value="event">행사 현장 무드 (결혼식/페스티벌)</option>
                          <option value="frame">디자인 프레임 출력 시안</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-400 mb-1">인화지 외형 레이아웃 비율</label>
                        <select
                          value={newGalleryRatio}
                          onChange={(e) => setNewGalleryRatio(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 text-xs text-neutral-800 border rounded-lg focus:outline-none focus:border-rose-500 bg-white"
                        >
                          <option value="portrait">세로형 (Portrait 무드)</option>
                          <option value="landscape">가로형 (Landscape 무드)</option>
                          <option value="square">정사각형 (Square 무드)</option>
                        </select>
                      </div>
                    </div>

                    {/* Dual Mode UI: Upload local image file directly or paste external URL */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider mr-2">이미지 소스 방식 설정 :</span>
                        <button
                          type="button"
                          onClick={() => setGalleryUploadMode("file")}
                          className={`px-3 py-1 text-[10.5px] font-extrabold rounded-lg transition-colors cursor-pointer ${
                            galleryUploadMode === "file"
                              ? "bg-rose-500 text-white shadow-xs"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-500"
                          }`}
                        >
                          📁 내 컴퓨터에서 직접 사진 올리기 (로컬 기기 업로드)
                        </button>
                        <button
                          type="button"
                          onClick={() => setGalleryUploadMode("url")}
                          className={`px-3 py-1 text-[10.5px] font-extrabold rounded-lg transition-colors cursor-pointer ${
                            galleryUploadMode === "url"
                              ? "bg-rose-500 text-white shadow-xs"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-500"
                          }`}
                        >
                          🔗 웹 사이트 외부 이미지 주소 링크 붙여넣기
                        </button>
                      </div>

                      {galleryUploadMode === "file" ? (
                        <div className="space-y-2">
                          <label className="block text-[9.5px] font-bold text-gray-400">네컷 인화지 원본 또는 촬영 사진 업로드 (자동 압축 최적화 수행)</label>
                          <div className="flex flex-col sm:flex-row gap-4 items-center bg-rose-50/20 p-4 rounded-xl border border-dashed border-rose-200">
                            <label className="w-full sm:w-auto shrink-0 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 hover:border-rose-400 font-extrabold text-[11px] px-4 py-2.5 rounded-lg text-center cursor-pointer transition-colors shadow-xs">
                              📷 사진 파일 선택하기
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setLocalImageFile(file);
                                }}
                              />
                            </label>

                            <div className="flex-1 text-center sm:text-left">
                              {localImageFile ? (
                                <div className="space-y-1">
                                  <p className="text-[11px] font-black text-rose-600 font-mono">
                                    ✓ 선택 완료: {localImageFile.name} ({(localImageFile.size / 1024 / 1024).toFixed(2)} MB)
                                  </p>
                                  <p className="text-[9px] text-gray-400">
                                    설치 등재 버튼을 클릭하시면, 디바이스 과부하 방지를 위해 자동 리사이징 및 고성능 무손실 인코딩이 즉각 개시됩니다.
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                  드래그해서 이곳에 사진을 놓거나 좌측 [사진 파일 선택하기] 버튼을 눌러 촬영본 이미지를 올려주세요. <br/>
                                  일체 데이터는 파이어베이스(Firebase Firestore Direct Sync) 클라우드 전역에 자동 보관됩니다.
                                </p>
                              )}
                            </div>

                            {localImageFile && (
                              <div className="w-14 h-14 rounded-lg overflow-hidden border border-rose-350 shadow-xs relative bg-white shrink-0">
                                <img
                                  src={URL.createObjectURL(localImageFile)}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLocalImageFile(null);
                                  }}
                                  className="absolute top-0 right-0 bg-red-500 text-white text-[8px] w-3 h-3 flex items-center justify-center rounded-bl font-mono"
                                  title="취소"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-[9.5px] font-bold text-gray-400">현장 설치 촬영본 고화질 이미지 URL 주소</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newGalleryImageUrl}
                              onChange={(e) => setNewGalleryImageUrl(e.target.value)}
                              placeholder="https://images.unsplash.com/... 또는 실제 외부 이미지 전체 경로 입력"
                              className="flex-1 px-2.5 py-1.5 text-xs text-neutral-800 border rounded-lg focus:outline-none focus:border-rose-500 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const photos = [
                                  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800",
                                  "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=800",
                                  "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800",
                                  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800",
                                  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800"
                                ];
                                const randomPic = photos[Math.floor(Math.random() * photos.length)];
                                setNewGalleryImageUrl(randomPic);
                              }}
                              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10.5px] font-bold px-3 py-1.5 rounded-lg shrink-0 transition-colors"
                            >
                              랜덤 한국형 실무사진 주소 매핑 📸
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={isProcessingImage}
                        onClick={async () => {
                          if (!newGalleryTitle.trim()) {
                            alert("참가 행사 타이틀 및 장소명을 기입해주세요! 🥲");
                            return;
                          }

                          setIsProcessingImage(true);
                          try {
                            let finalUrl = "";
                            
                            if (galleryUploadMode === "file") {
                              if (!localImageFile) {
                                alert("업로드할 파일 사진을 먼저 등록해주세요! 📷");
                                setIsProcessingImage(false);
                                return;
                              }
                              // Compress client-side directly!
                              finalUrl = await compressAndConvertToBase64(localImageFile);
                            } else {
                              if (!newGalleryImageUrl.trim()) {
                                alert("이미지 주소 URL을 작성해주세요!");
                                setIsProcessingImage(false);
                                return;
                              }
                              finalUrl = newGalleryImageUrl.trim();
                            }

                            const newItemId = "GAL_" + Math.random().toString(36).substr(2, 9).toUpperCase();
                            const newItem = {
                              id: newItemId,
                              title: newGalleryTitle.trim(),
                              tag: newGalleryTag.trim() || "무제한 대여 설치 현장",
                              category: newGalleryCategory,
                              imageUrl: finalUrl,
                              ratio: newGalleryRatio
                            };

                            try {
                              await setDoc(doc(db, "gallery", newItemId), {
                                title: newItem.title,
                                tag: newItem.tag,
                                category: newItem.category,
                                imageUrl: newItem.imageUrl,
                                ratio: newItem.ratio,
                                createdAt: new Date().toISOString()
                              });
                            } catch (writeErr) {
                              console.warn("Failed to save gallery item to Firestore (falling back to local cache):", writeErr);
                              // Fallback locally
                              const updated = [newItem, ...galleryItems];
                              setGalleryItems(updated);
                              localStorage.setItem("lmp_gallery_items", JSON.stringify(updated));
                            }

                            // Complete reset states
                            setNewGalleryTitle("");
                            setNewGalleryTag("");
                            setNewGalleryImageUrl("");
                            setLocalImageFile(null);
                            alert(`🎉 [${newGalleryTitle.trim()}] 레퍼런스가 홈페이지 전역 사진첩에 완벽히 등재 완료되었습니다!`);
                          } catch (err) {
                            console.error("Failed to upload/save gallery item", err);
                            alert("⚠️ 이미지 업로드 변환 도중 실패했습니다. 파일 형식을 다시 확인하십시오.");
                          } finally {
                            setIsProcessingImage(false);
                          }
                        }}
                        className={`font-bold text-xs py-2.5 px-6 rounded-xl cursor-pointer shadow-xs transition-all active:scale-95 text-white ${
                          isProcessingImage 
                            ? "bg-rose-350 cursor-not-allowed animate-pulse" 
                            : "bg-rose-500 hover:bg-rose-600"
                        }`}
                      >
                        {isProcessingImage ? "고효율 사진 압축 및 실시간 등재 동기화 중... ⏳" : "신규 레퍼런스 실시간 현장 등재 (클라우드 동기화) ✙"}
                      </button>
                    </div>
                  </div>

                  {/* Existing interactive Gallery Items Deletion List Dashboard */}
                  <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                    <div className="p-3 bg-neutral-50/50 border-b border-gray-150 flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-neutral-500">등록된 레퍼런스 리스트 목록</span>
                      <span className="text-[9px] text-gray-400 font-bold">* 삭제 버튼 클릭 시, 해당 갤러리 레퍼런스가 홈페이지에서 즉시 안전 소멸됩니다.</span>
                    </div>

                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b text-gray-400 font-semibold text-[10px]">
                          <th className="p-2 w-16">대표 썸네일</th>
                          <th className="p-2">카테고리 분류</th>
                          <th className="p-2">행사 현장 제목</th>
                          <th className="p-2">설명 태그명</th>
                          <th className="p-2 text-center w-20">현장기록 영구삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-neutral-700">
                        {galleryItems.map((item) => (
                          <tr key={item.id} className="hover:bg-neutral-50/40 transition-colors">
                            <td className="p-2">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 object-cover rounded-md border"
                              />
                            </td>
                            <td className="p-2">
                              <span className="bg-[#FAF9F6] px-2 py-0.5 rounded border border-rose-50 text-[9.5px] font-bold text-neutral-500">
                                {item.category === "machine" ? "임직 기계설치" : item.category === "event" ? "실제 행사현장" : "프레임시안"}
                              </span>
                            </td>
                            <td className="p-2 font-bold text-neutral-800">{item.title}</td>
                            <td className="p-2 font-mono text-rose-500 font-bold">{item.tag}</td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(`정말로 이 [${item.title}] 레퍼런스 기록을 갤러리에서 영구히 삭제하시겠습니까?`)) {
                                    // Offline cache update
                                    const updated = galleryItems.filter(x => x.id !== item.id);
                                    setGalleryItems(updated);
                                    localStorage.setItem("lmp_gallery_items", JSON.stringify(updated));

                                    try {
                                      await deleteDoc(doc(db, "gallery", item.id));
                                      alert("성공적으로 해당 레퍼런스 미디어를 홈페이지 전역에서 안전 탈거 처리했습니다! ✕");
                                    } catch (err) {
                                      console.warn("Failed to delete gallery item from firestore (removed from offline storage):", err);
                                      alert("성공적으로 홈페이지 로컬 전역에서 탈거 완료되었습니다! ✕");
                                    }
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 font-extrabold text-[10.5px] cursor-pointer"
                              >
                                ✕ 삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Admin Footer */}
              <div className="bg-[#FAF9F6] p-4 border-t flex justify-between items-center text-[10.5px] text-gray-400">
                <span>🔒 비즈니스 어드민 자산 관리 콘솔 - 브라우저 세션 기반 임시 저장 방식 채택</span>
                <button
                  type="button"
                  onClick={() => setIsAdminMode(false)}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  어드민 데스크 나가기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submitted Success Confirmation Modal */}
      <AnimatePresence>
        {showSuccessModal && newlyCreatedInquiry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#FAF9F6] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-100 text-center space-y-5"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-2xl animate-bounce">
                🎉
              </div>
              
              <div className="space-y-1">
                <h3 className="font-sans font-black text-lg sm:text-xl text-neutral-900">상담 신청서 수신 완료!</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  신청해주셔서 대단히 고맙습니다. <strong className="text-neutral-800">{newlyCreatedInquiry.clientName}</strong>님의 소중한 파티가 멋지게 기억될 수 있게 정성 가득 담아 연락드리겠습니다.
                </p>
              </div>

              {/* Receipt style */}
              <div className="bg-white p-4 rounded-2xl border border-rose-100 text-left text-xs space-y-2.5">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-400">접수 등록 코드 ID</span>
                  <span className="font-bold text-rose-500">{newlyCreatedInquiry.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">행사 예정날</span>
                  <span className="font-bold text-neutral-800 font-serif">{newlyCreatedInquiry.eventDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">대여 신청 구분</span>
                  <span className="font-bold text-neutral-800">
                    {newlyCreatedInquiry.rentalType === "hourly" ? "시간제" : "1일권"} 대여 ({newlyCreatedInquiry.rentalDuration}시간/일)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">임시 추정가</span>
                  <span className="font-bold text-[#D97706]">₩{newlyCreatedInquiry.estimatedPrice.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">프레임 시안 글</span>
                  <span className="font-bold text-neutral-800 truncate max-w-[150px]">"{newlyCreatedInquiry.customFrameText}"</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-[10.5px] text-rose-500 font-bold leading-relaxed">
                  🚨 상담 마스터가 즉시 확인 후 15분 이내로 반갑게 해피콜을 드려요!
                </p>
                <div className="flex gap-2">
                  <a
                    href="https://open.kakao.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-amber-300 hover:bg-amber-400 text-neutral-900 font-bold text-xs py-2.5 rounded-xl transition-colors inline-block text-center"
                  >
                    카톡 시안 상담방 입장
                  </a>
                  <button
                    onClick={() => {
                        setShowSuccessModal(false);
                    }}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-2.5 rounded-xl transition-colors"
                  >
                    확인 및 닫기
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer copyright */}
      <footer className="bg-neutral-900 text-gray-400 pt-12 pb-8 sm:pb-12 border-t border-neutral-850 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Branding */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-white">
                <span className="font-display font-black text-lg tracking-tight">LifeMyPhotos</span>
                <span className="bg-white text-black text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">LMP</span>
               </div>
              <p className="text-xs text-gray-400 leading-relaxed font-normal">
                결혼식 피로연, 초등학교 대제, 동아리 한마당 등에서 영원히 남아 빛나는 최고의 네컷사진 렌탈 경험을 만드는 셀프포토부스 전문 브랜드입니다.
              </p>
            </div>

            {/* Keyword listings for SEO */}
            <div className="space-y-3 col-span-2">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">주요 테마 키워드 (#SEO)</h4>
              <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-400 font-mono">
                {["인생네컷 대여", "포토부스 대여", "셀프 포토부스", "결혼식 포토부스", "학교축제 포토부스", "유치원 행사 포토부스", "즉석사진 부스 렌탈"].map((keyword) => (
                  <span key={keyword} className="border border-neutral-800 px-2 py-0.5 rounded-lg hover:border-neutral-700 hover:text-white transition-colors cursor-default">
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Inquiries */}
            <div className="space-y-2">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">고객 지원실</h4>
              <div className="text-xs space-y-1 text-gray-400 leading-normal">
                <div>주말 및 공휴일 행사 배차 및 가동 상시 원활</div>
                <div>고객 지원 전화 : <strong className="text-white">{companyPhone}</strong></div>
                <div>이메일 : {companyEmail}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-850 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 font-mono">
            <div>&copy; 2026 LifeMyPhotos Inc. All rights reserved.</div>
            <div className="flex gap-3 mt-2 sm:mt-0 items-center text-xs flex-wrap justify-center">
              <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
              <span className="text-neutral-800">|</span>
              <a href="#" className="hover:text-white transition-colors">이용약관</a>
              <span className="text-neutral-800">|</span>
              <button
                type="button"
                onClick={() => {
                  const pass = prompt("🔑 관리자 시스템 보안 패스워드를 입력해주세요:");
                  if (pass === "3714") {
                    setIsAdminMode(true);
                    alert("🔓 인증 성공! 세세한 일체 제어 관제센터(어드민)가 활성화되었습니다.");
                  } else if (pass !== null) {
                    alert("❌ 올바른 어드민 패스워드가 아닙니다.");
                  }
                }}
                className="text-rose-500 hover:text-rose-400 font-bold hover:underline transition-all cursor-pointer flex items-center gap-1 bg-neutral-850 px-2 py-1 rounded"
                title="관리자 제어 데스크 직접 연결"
              >
                <span>🔑</span>
                <span>관리자 로그인 (Admin)</span>
              </button>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
