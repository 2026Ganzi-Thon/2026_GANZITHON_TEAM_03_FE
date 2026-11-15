import firstArtwork from '@/assets/onboarding/onboarding-art-one.webp'
import secondArtwork from '@/assets/onboarding/onboarding-art-two.webp'
import thirdArtwork from '@/assets/onboarding/onboarding-art-three.webp'

export const onboardingSlides = [
  {
    title: <>세상이 조금 벅찬 날엔,<br />당신의 섬으로 오세요.</>,
    description: <>여기서는 잠시 숨을 골라도 괜찮아요.<br />누구의 속도도 따라가지 않아도 되는 곳이에요.</>,
    artwork: firstArtwork,
    artworkAlt: '치즈가 놓인 아늑한 섬',
  },
  {
    title: <>어떤 마음이든,<br />여기에 놓아두세요.</>,
    description: <>오늘의 감정을 골라 양에게 먹이를 주세요.<br />긴 이야기를 쓰지 않아도 괜찮아요.</>,
    artwork: secondArtwork,
    artworkAlt: '양을 다정하게 쓰다듬는 손',
  },
  {
    title: <>혼자 품었던 마음에<br />다른 온기가 닿을 거예요.</>,
    description: <>나누고 싶은 고민은 치즈 숙성소에 남겨요.<br />다른 섬의 누군가가 천천히 위로를 더해요.</>,
    artwork: thirdArtwork,
    artworkAlt: '편지와 치즈를 담은 접시를 건네는 손',
  },
] as const
