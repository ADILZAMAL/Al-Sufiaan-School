declare module 'react-native-deck-swiper' {
  import { Component } from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  export interface DeckProps<T> {
    cards: T[];
    renderCard: (card: T, cardIndex: number) => React.ReactElement | null;
    onSwipedRight?: (cardIndex: number) => void;
    onSwipedLeft?: (cardIndex: number) => void;
    onSwipedTop?: (cardIndex: number) => void;
    onSwipedBottom?: (cardIndex: number) => void;
    cardIndex?: number;
    stackSize?: number;
    stackSeparation?: number;
    animateCardOpacity?: boolean;
    animateOverlayLabelsOpacity?: boolean;
    disableTopSwipe?: boolean;
    disableBottomSwipe?: boolean;
    backgroundColor?: string;
    cardVerticalMargin?: number;
    marginTop?: number;
    marginBottom?: number;
    swipeAnimationDuration?: number;
    goBackToPreviousCardOnSwipeTop?: boolean;
    goBackToPreviousCardOnSwipeBottom?: boolean;
    onSwipedAll?: () => void;
    verticalSwipe?: boolean;
    horizontalSwipe?: boolean;
    showSecondCard?: boolean;
    infinite?: boolean;
    childrenOnTop?: boolean;
    overlayLabels?: {
      left?: {
        title: string;
        style: StyleProp<ViewStyle>;
        element?: React.ReactElement;
      };
      right?: {
        title: string;
        style: StyleProp<ViewStyle>;
        element?: React.ReactElement;
      };
      top?: {
        title: string;
        style: StyleProp<ViewStyle>;
        element?: React.ReactElement;
      };
      bottom?: {
        title: string;
        style: StyleProp<ViewStyle>;
        element?: React.ReactElement;
      };
    };
  }

  export default class Deck<T = any> extends Component<DeckProps<T>> {
    swipeLeft: () => void;
    swipeRight: () => void;
    swipeTop: () => void;
    swipeBottom: () => void;
    goBackToPreviousCard: () => void;
    jumpToCardIndex: (index: number) => void;
  }
}
