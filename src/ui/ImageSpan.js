/* @flow */

import autobind from 'class-autobind';
import cx from 'classnames';
import React, {Component} from 'react';
import {Entity} from 'draft-js';

import styles from './ImageSpan.css';

import type {ContentState} from 'draft-js';

// TODO: Use a more specific type here.
type ReactNode = any;

type Props = {
  children: ReactNode;
  entityKey: string;
  contentState: ContentState,
  className?: string;
};

type State = {
  width: number;
  height: number;

  isYoutube: boolean;
  ytId?: string;
  ytThumb?: string;
};

export default class ImageSpan extends Component {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    autobind(this);
    const entity = props.contentState.getEntity(props.entityKey);
    const {width, height} = entity.getData();
    this.state = {
      width,
      height,
      isYoutube: false
    };
  }

  componentDidMount() {
    let {width, height} = this.state;
    const entity = this.props.contentState.getEntity(this.props.entityKey);
    let {src} = entity.getData();
    const vidProps = this.videoProps(src)
    if (vidProps) {
      src = `https://img.youtube.com/vi/${vidProps.id}/0.jpg`;
    }
    const image = new Image();
    image.src = src;
    image.onload = () => {
      if (width == null || height == null || vidProps) {
        if (vidProps) {
          width /= 3;
          height /= 3;
        }
        this.setState(vidProps ? 
          {width: image.width, height: image.height, isYoutube: true, ytId: vidProps.id, ytThumbnail:src}:
          {width: image.width, height: image.height});
        Entity.mergeData(
          this.props.entityKey,
          {
            width: image.width,
            height: image.height,
            originalWidth: image.width,
            originalHeight: image.height,
          }
        );
      }
    };
  }

  videoProps(src) {
    try {
      const url = /https?:\/\//ig.test(src) ? new URL(src) : new URL('http://'+src);
      if (/(www\.)?youtu\.be/ig.test(url.hostname)) {
        return { id: url.pathname.substr(1) };
      }
      else if (/(www\.)?youtube\.com/ig.test(url.hostname)) {
        return { id: url.searchParams.get('v') };
      }
    }
    catch(_) {}
    return null;
  }

  render() {
    const {width, height, isYoutube, ytThumbnail} = this.state;
    let {className} = this.props;
    const entity = this.props.contentState.getEntity(this.props.entityKey);
    const {src} = entity.getData();

    className = isYoutube ?  
      cx(className, styles['video-thumbnail'], styles.root) :
      cx(className, styles.root); 
    console.log(styles);
    console.log(className);
    const imgSrc = isYoutube ? ytThumbnail : src;
    const imageStyle = {
      verticalAlign: 'bottom',
      backgroundImage: `url("${imgSrc}")`,
      backgroundSize: `${width}px ${height}px`,
      lineHeight: `${height}px`,
      fontSize: `${height}px`,
      width,
      height,
      letterSpacing: width,
    };

    return (
      <span
        className={className}
        style={imageStyle}
        onClick={this._onClick}
      >
        {this.props.children}
      </span>
    );
  }

  _onClick() {
    if (this.state.isYoutube) {
      const entity = this.props.contentState.getEntity(this.props.entityKey);
      const {src} = entity.getData();
      window.open(src,"_blank")
    }
    else {
      console.log('image clicked');
    }
  }

  _handleResize(event: Object, data: Object) {
    const {width, height} = data.size;
    this.setState({width, height});
    Entity.mergeData(
      this.props.entityKey,
      {width, height}
    );
  }
}
