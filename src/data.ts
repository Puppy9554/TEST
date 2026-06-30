/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UseCase, GalleryItem, Review, FAQItem } from "./types";

export const USE_CASES: UseCase[] = [
  {
    id: "wedding",
    title: "설레는 우리 결혼식 & 피로연 방명록",
    description: "하객들이 식장에 일찍 와서 신나게 사진 찍고 방명록에 뽀짝하게 붙여요! 대기 시간이 지루할 틈 없는 신의 한 수 분위기 메이커랍니다.",
    sampleText: "민수 ❤️ 윤아 꽃길 시작하는 날",
    sampleSubText: "2026.10.18 우리 결혼합니다",
    sampleColors: {
      bg: "#FAF9F6", // Soft Warm Off-white
      text: "#524F4A", 
      border: "#D1C9BE" 
    },
    sampleSticker: "minimal",
    imageUrl: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "kindergarten",
    title: "소중한 우리 아이들의 유치원 & 어린이집 운동회",
    description: "아이들의 까르르 터지는 예쁜 웃음과 부모님들의 대박 반응 1등! 한 장은 가방에 달고, 한 장은 냉장고에 꾹 평생 추억으로 기억돼요.",
    sampleText: "새봄유치원 단짝 무지개 축제",
    sampleSubText: "2026.05.05 아주 신나는 어린이날",
    sampleColors: {
      bg: "#FFFBEB", // Pastel yellow
      text: "#B45309", 
      border: "#FDE68A" 
    },
    sampleSticker: "flowers",
    imageUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "church",
    title: "은혜와 우정 충전! 교회 동청년 수련회 & 늘푸른 캠프",
    description: "서먹했던 새 친구랑도 네 컷 앞에만 서면 3초 만에 짱친 모드! 선교회나 수련회에서 웃음꽃 피우는 필수 추천 꿀템입니다.",
    sampleText: "하나되어 전진하는 온누리 청년회",
    sampleSubText: "우리가 함께함이 참 기쁩니다, 2026",
    sampleColors: {
      bg: "#EFF6FF", 
      text: "#1E3A8A", 
      border: "#BFDBFE" 
    },
    sampleSticker: "stars",
    imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "campus",
    title: "왁자지껄 신나는 대학교 동아리 축제 & 주점 부스",
    description: "요즘 대세 네컷 카메라 감성을 야외나 동아리방 축제에 통째로! 예약 행렬이 아침부터 밤까지 끊이지 않는 인싸 핫플이 됩니다.",
    sampleText: "청춘의 푸른 가을밤 대동제",
    sampleSubText: "우리들의 찬란한 순간, 2026",
    sampleColors: {
      bg: "#111827", 
      text: "#F3F4F6", 
      border: "#374151" 
    },
    sampleSticker: "bubbles",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "recital",
    title: "음악 피아노 연주회 & 미미 전시 미술회",
    description: "아름다운 작품들이 가득한 날, 직접 찾아와 축하해주신 관람객분들께 고화질의 인화 사진 티켓으로 평생 잊지 못할 감사를 전하세요.",
    sampleText: "소정 피아노 연주 발표회",
    sampleSubText: "가을밤 아름다운 선율을 가득 안고",
    sampleColors: {
      bg: "#0A0A0A", 
      text: "#D4AF37", 
      border: "#1C1C1C"
    },
    sampleSticker: "minimal",
    imageUrl: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "popup",
    title: "트렌디한 회사 브랜드 팝업 & 루프탑 기업 파티",
    description: "인스타그램 피드 업로드를 백퍼 부르는 나만의 네컷 프레임 브랜딩! 자연스러운 온/오프라인 홍보와 해시태그 확산 속도가 어마무시해집니다.",
    sampleText: "무드 한 조각 성수 팝업스토어",
    sampleSubText: "오늘 나만의 특별한 하루를 기록해요",
    sampleColors: {
      bg: "#ECFDF5", 
      text: "#065F46", 
      border: "#A7F3D0" 
    },
    sampleSticker: "minimal",
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800"
  }
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "g1",
    category: "machine",
    title: "오리지널 따뜻한 원목 감성 꽉 찬 포토부스",
    imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600",
    tag: "포토 부스 실물",
    ratio: "portrait"
  },
  {
    id: "g2",
    category: "event",
    title: "웃음이 멈추지 않는 마당 야외 축제 현장 설치 모습",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600",
    tag: "행사 분위기",
    ratio: "landscape"
  },
  {
    id: "g3",
    category: "frame",
    title: "달콤 로맨틱 파스텔 핑크 결혼 네컷 커스텀 시안",
    imageUrl: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=600",
    tag: "디자인 프레임",
    ratio: "portrait"
  },
  {
    id: "g4",
    category: "event",
    title: "친구들과 3초 만에 짱친되는 동아리방 미니 네컷",
    imageUrl: "https://images.unsplash.com/photo-1531844251246-9a1bfaae0d76?auto=format&fit=crop&q=80&w=600",
    tag: "축제 무드",
    ratio: "portrait"
  },
  {
    id: "g5",
    category: "machine",
    title: "콤팩트 화이트 앰비언트 LED 포토 부스 실물 완벽 가동",
    imageUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=600",
    tag: "포토 부스 실물",
    ratio: "square"
  },
  {
    id: "g6",
    category: "frame",
    title: "자연 감성 초록 싱그러운 웨딩 커스텀 프레임 출력본",
    imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600",
    tag: "디자인 프레임",
    ratio: "landscape"
  }
];

export const REVIEWS: Review[] = [
  {
    id: "r1",
    rating: 5,
    author: "박상현 (서울 동교교회 청년회장)",
    role: "교회 연합 수련회 대여",
    content: "학생들이랑 수련회 이벤트용으로 하루 빌렸는데 진짜 반응 대박 터졌습니다! 예배 끝나고 쉬는 시간마다 포토 장비 앞에 서로 찍겠다고 줄이 엄청 길었어요. 행사 날짜랑 교회 말씀 구절도 정말 이쁘게 무료로 프레임에 넣어주셔서 모두 감동했습니다. 감사해요!",
    date: "2026.06.15",
    eventTag: "교회 행사"
  },
  {
    id: "r2",
    rating: 5,
    author: "박서윤 (서초 어린이집 교사)",
    role: "새봄 운동회 어린이 축제",
    content: "아이들이 알록달록 스티커 붙이고 뽀짝하게 사진 찍어서 부모님들께 선물하니 다들 너무 마음에 들어하셨어요! 고장 날 일 전혀 없이 설치 엔지니어님이 튼튼하게 세팅해주셨고, 조작법도 엄청 쉬워서 선생님들도 수월하게 썼답니다. 완전 강추해요!",
    date: "2026.05.10",
    eventTag: "유치원 행사"
  },
  {
    id: "r3",
    rating: 5,
    author: "지선아 (성수동 야외웨딩 하객)",
    role: "신부 혜림 님의 사랑스런 결혼식",
    content: "식장 로비가 썰렁할 뻔했는데 이 네컷 기계 하나 덕분에 금방 미소 가득 축제 축하 파티가 됐어요! 한 장 예쁘게 뽑아서 결혼식 방명록에 수줍게 착 붙이고, 한 장은 지갑 속 행복한 일상네컷으로 챙겨왔답니다. 인화지가 손때 묻지 않는 고급 재질이라 물에도 끄떡없어 보여요.",
    date: "2026.04.18",
    eventTag: "결혼식 방명록"
  },
  {
    id: "r4",
    rating: 5,
    author: "정주영 (연세대학교 문화동아리 기획팀)",
    role: "대학 대동제 동아리 주점",
    content: "아침부터 한밤중 밤샘 축제까지 끄떡없이 쌩쌩하게 일 다해주네요! 사진에 박힌 QR 코드로 스마트폰에서 무선으로 찰칵 움직이는 고화질 동영상 쇼츠 파일 바로 받아 갈 수 있는 기능이 최고로 쏠쏠했어요. 내년 학생회 대동제 때 무조건 고민 않고 조기 재예약 찜입니다!",
    date: "2026.05.28",
    eventTag: "대학 축제"
  }
];

export const FAQS: FAQItem[] = [
  {
    id: "faq_1",
    question: "사진 인화 화질이랑 종이 품질은 정말 좋은가요?",
    answer: "네! 길거리 매장에서 보시던 대형 브랜드 부스에서 사용하는 것과 동일한 '초정밀 초고속 염료승화형 인화기'만 사용해요. 물방울이 닿아도 젖어 번지지 않고 지문도 안 묻는 고급스러운 무광 고급 인화지라서 평생 동안 색 바램 없이 깨끗하게 집 냉장고에 간직하실 수 있어요."
  },
  {
    id: "faq_2",
    question: "서울/경기 수도권 말고 다른 지방 지역도 예약/배송이 되나요?",
    answer: "그럼요! 기계를 직접 가뿐히 원스톱으로 들고 가서 완벽 설치해 드립니다. 서울, 경기, 인천은 안전 배송 및 정성 가득한 방문 무료 철수 서비스를 기본 포함하고 있으며, 그 외 지방(강원, 충청, 전라, 경상 등)도 착한 거리를 고려한 최소한의 주유 운임만 보태주시면 기분 좋게 쌩하고 씩씩하게 설치하러 달려갑니다!"
  },
  {
    id: "faq_3",
    question: "인터넷 와이파이가 안 되는 실외 공원이나 완전 야외 운동장에서도 잘 되나요?",
    answer: "당연하죠! 기계 내부 자체에 지능형 단독 촬영 모드가 깃들어 있어서 220V 콘센트 전원 플러그 딱 하나만 연결해주시면 드넓은 벌판이든 숲속이든 멋지게 작동됩니다. 모바일 무선 핫스팟 다운로드 등이 가능하게 무선 중계기도 들고 가며, 혹여나 통신 환경이 너무 열악해도 촬영 원본 및 움짤 동영상은 저희가 백업하여 다음날 이메일로 다채롭게 쏴 드립니다."
  },
  {
    id: "faq_4",
    question: "하객분들이 하루 동안 사진을 너무 많이 찍어 뽑으면 인화지 추가 요금이 생기나요?",
    answer: "우와, 전혀요! 예약 대여해 주신 든든한 시간 동안에는 수천 장, 수만 장 사진 출력을 맘껏 해 가셔도 추가 비용은 정말 단 1원도 붙지 않는 '완전 무제한 공짜 프리'입니다. 아끼지 마시고 주위 하객분들께 기분 좋게 한가득 선물로 선물해 주세요!"
  },
  {
    id: "faq_5",
    question: "무료로 전담 지원해 주시는 나만의 커스텀 프레임 디자인은 어떻게 상담하나요?",
    answer: "예약 접수가 끝나는 동시에 담당 디자이너와 가벼운 카톡 전담 소통 창구가 매칭됩니다. 원하시는 예비 신랑신부 미소 사진, 회사 이쁜 로고, 손수 쓰신 글귀나 어울리는 귀여운 테마 캐릭터 무드만 솔직히 공유해주시면, 맘에 쏙 들 때까지 횟수 무제한으로 시안 조율을 완벽하게 해드립니다!"
  }
];
