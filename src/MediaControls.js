// @flow

import React, { Component, type Node } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  Animated,
  Image,
  TouchableWithoutFeedback,
  // eslint ignore next $FlowFixMe
} from 'react-native';
import {Slider} from '@miblanchard/react-native-slider';
import styles from './MediaControlsStyles';
import { humanizeVideoDuration, noop } from './Utils';
import PLAYER_STATES, { type PlayerState } from './Constants';

type Props = {
  toolbar: Node,
  mainColor: string,
  isLoading: boolean,
  progress: number,
  duration: number,
  playerState: PlayerState,
  onFullScreen: Function,
  onPaused: Function,
  onReplay: Function,
  onSeek: Function,
  onSeeking: Function,
  playIcon: string,
  pauseIcon: string,
  replayIcon: string,
  controlsColor: string,
  controlsStyle: Object,
  iconStyle: Object,
};

type State = {
  opacity: Object,
  isVisible: boolean,
};

class MediaControls extends Component<Props, State> {
  static defaultProps = {
    controlsColor: 'rgba(0,0,0,0)',
    controlsStyle: null,
    iconStyle: null,
    isFullScreen: false,
    isLoading: false,
    mainColor: 'rgba(12, 83, 175, 0.9)',
    onFullScreen: noop,
    onReplay: noop,
    onSeeking: noop,
    pauseIcon: require('./assets/ic_pause.png'),
    playIcon: require('./assets/ic_play.png'),
    replayIcon: require('./assets/ic_replay.png'),
  };

  state = {
    opacity: new Animated.Value(1),
    isVisible: true,
  };

  componentDidMount() {
    this.fadeOutControls(5000);
  }

  componentDidUpdate(prevProps) {
    if (this.props.playerState === PLAYER_STATES.ENDED && prevProps.playerState !== PLAYER_STATES.ENDED) {
      this.fadeInControls(false);
    }
  }

  onReplay = () => {
    this.fadeOutControls(5000);
    this.props.onReplay();
  };

  onPause = () => {
    const { playerState, onPaused } = this.props;
    const { PLAYING, PAUSED } = PLAYER_STATES;
    switch (playerState) {
      case PLAYING: {
        this.cancelAnimation();
        break;
      }
      case PAUSED: {
        this.fadeOutControls(5000);
        break;
      }
      default:
        break;
    }

    const newPlayerState = playerState === PLAYING ? PAUSED : PLAYING;
    return onPaused(newPlayerState);
  };

  setLoadingView = () => <ActivityIndicator size="large" color="#FFF" />;

  setPlayerControls = (playerState: PlayerState) => {
    const { controlsColor, controlsStyle, iconStyle } = this.props;
    const icon = this.getPlayerStateIcon(playerState);
    const pressAction =
      playerState === PLAYER_STATES.ENDED ? this.onReplay : this.onPause;
    return (
      <TouchableOpacity
        style={[
          styles.playButton,
          { backgroundColor: controlsColor },
          controlsStyle,
        ]}
        onPress={pressAction}
      >
        <Image source={icon} style={[styles.playIcon, iconStyle]} />
      </TouchableOpacity>
    );
  };

  getPlayerStateIcon = (playerState: PlayerState) => {
    const { playIcon, pauseIcon, replayIcon } = this.props;
    switch (playerState) {
      case PLAYER_STATES.PAUSED:
        // eslint ignore next $FlowFixMe
        return playIcon;
      case PLAYER_STATES.PLAYING:
        // eslint ignore next $FlowFixMe
        return pauseIcon;
      case PLAYER_STATES.ENDED:
        // eslint ignore next $FlowFixMe
        return replayIcon;
      default:
        return null;
    }
  };

  cancelAnimation = () => {
    this.state.opacity.stopAnimation(() => {
      this.setState({ isVisible: true });
    });
  };

  toggleControls = () => {
    // value is the last value of the animation when stop animation was called.
    // As this is an opacity effect, I (Charlie) used the value (0 or 1) as a boolean
    this.state.opacity.stopAnimation((value: number) => {
      this.setState({ isVisible: !!value });
      return value ? this.fadeOutControls() : this.fadeInControls();
    });
  };

  fadeOutControls = (delay: number = 0) => {
    Animated.timing(this.state.opacity, {
      useNativeDriver: false,
      toValue: 0,
      duration: 300,
      delay,
    }).start(result => {
      /* I noticed that the callback is called twice, when it is invoked and when it completely finished
      This prevents some flickering */
      if (result.finished) this.setState({ isVisible: false });
    });
  };

  fadeInControls = (loop: boolean = true) => {
    this.setState({ isVisible: true });
    Animated.timing(this.state.opacity, {
      useNativeDriver: false,
      toValue: 1,
      duration: 300,
      delay: 0,
    }).start(() => {
      if (loop) {
        this.fadeOutControls(5000);
      }
    });
  };

  dragging = (value: number) => {
    const { onSeeking, playerState } = this.props;

    onSeeking(value);
    if (playerState === PLAYER_STATES.PAUSED) return;

    this.onPause();
  };

  seekVideo = (value: number) => {
    this.props.onSeek(value);
    this.onPause();
  };

  renderControls() {
    const {
      duration,
      isLoading,
      mainColor,
      onFullScreen,
      playerState,
      progress,
      toolbar,
    } = this.props;

    // this let us block the controls
    if (!this.state.isVisible) return null;

    // eslint ignore next $FlowFixMe
    const fullScreenImage = require('./assets/ic_fullscreen.png');
    return (
      <View style={styles.container}>
        <View style={[styles.controlsRow, styles.toolbarRow]}>{toolbar}</View>
        <View style={[styles.controlsRow]}>
          {isLoading
            ? this.setLoadingView()
            : this.setPlayerControls(playerState)}
        </View>
        <View style={[styles.controlsRow, styles.progressContainer]}>
          <View style={styles.progressColumnContainer}>
            <View style={[styles.timerLabelsContainer]}>
              <Text style={styles.timerLabel}>
                {humanizeVideoDuration(progress)}
              </Text>
              <Text style={styles.timerLabel}>
                {humanizeVideoDuration(duration)}
              </Text>
            </View>
            <Slider
              style={styles.progressSlider}
              onValueChange={this.dragging}
              onSlidingComplete={this.seekVideo}
              maximumValue={Math.floor(duration)}
              value={Math.floor(progress)}
              trackStyle={styles.track}
              thumbStyle={[styles.thumb, { borderColor: mainColor }]}
              minimumTrackTintColor={mainColor}
            />
          </View>
          <TouchableOpacity
            style={styles.fullScreenContainer}
            onPress={onFullScreen}
          >
            <Image source={fullScreenImage} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  render() {
    return (
      <TouchableWithoutFeedback onPress={this.toggleControls}>
        <Animated.View
          style={[styles.container, { opacity: this.state.opacity }]}
        >
          {this.renderControls()}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
}

export default MediaControls;
