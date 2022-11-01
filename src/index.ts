import Konva from "konva";
import { v4 as uuid } from "uuid";
import EventBus from "./EventBus";

type Props = { container: string } & Record<string, any>;

enum Events {
  Change = "change",
}

export default class AnimationControl extends EventBus {
  public container: string; // 容器id
  public containerEl: HTMLElement; // 容器dom
  public width: number; // 宽度
  public height: number; // 高度
  public unit1: number; // 单位刻度
  public duration: number; // 时常
  public top: number; // 顶部空余
  public left: number; // 左边空余
  public scaleleft: number; // 刻度左边空余
  public gap: number; // 刻度间隔
  public itemHeight; // 元素高度

  public stage: Konva.Stage; // 渲染平台
  public layer: Konva.Layer; // 主图层
  public group: Konva.Group; // 主图形组

  private offset: number = 0;

  private items: any[] = [];

  constructor(options: Props) {
    super();

    this.container = options.container;

    this.containerEl = document.getElementById(this.container)!;

    this.width = options.width ?? this.containerEl.clientWidth;
    this.height = options.height ?? this.containerEl.clientWidth;

    this.unit1 = options.unit1 ?? 1;

    this.duration = options.duration ?? 60 * 60;

    this.top = options.top ?? 0;

    this.left = options.left ?? 10;

    this.scaleleft = this.left + 20;

    this.gap = options.gap ?? 40;

    this.itemHeight = options.itemHeight ?? 20;

    this.draw();
  }

  draw() {
    this.stage = new Konva.Stage({
      container: this.container,
      width: this.width,
      height: this.height,
    });

    this.layer = new Konva.Layer({});

    this.group = new Konva.Group({
      draggable: true,
      dragBoundFunc: function (pos) {
        return {
          x: pos.x < 0 ? pos.x : 0,
          y: this.absolutePosition().y,
        };
      },
    });

    this.group.on("mouseenter", () => {
      this.stage.container().style.cursor = "move";
    });

    this.group.on("mouseleave", () => {
      this.stage.container().style.cursor = "default";
    });

    this.group.on("dragend", (e) => {
      this.offset = e.target.attrs.x;
    });

    this.drawScale();

    this.drawPointer();

    this.group.zIndex(0);
    this.layer.add(this.group);

    this.stage.add(this.layer);
  }

  addItem(opt: { duration: number } & Record<string, any>) {
    const _this = this;
    const slide = _this.drawSlide(); // 绘制轨道
    const width = opt.duration / this.unit1;

    const sTop = this.top + 60 + this.items.length * (this.itemHeight + 5);
    const item = new Konva.Line({
      points: [this.scaleleft, sTop, this.scaleleft + width * this.gap, sTop],
      stroke: "#177ddc",
      strokeWidth: this.itemHeight,
      draggable: true,
      dragBoundFunc: function (pos) {
        const x = pos.x - _this.offset > 0 ? pos.x : _this.offset;
        return {
          x: x,
          y: this.absolutePosition().y,
        };
      },
    });

    const obj = {
      id: uuid(),
      options: opt,
      _slide: slide,
      _item: item,
    };

    _this.items.push(obj);

    item.on("mouseenter", () => {
      this.stage.container().style.cursor = "move";
    });

    item.on("mouseleave", () => {
      this.stage.container().style.cursor = "default";
    });

    item.on("dragend", (e) => {
      const x = e.target.attrs.x;
      e.cancelBubble = true;

      this.emit(Events.Change, obj);
    });

    this.group.add(item);
    item.zIndex(1);
  }

  drawScale() {
    const rect = new Konva.Shape({
      stroke: "#ffffff",
      strokeWidth: 1,
      sceneFunc: (context, shape) => {
        const total = this.duration / this.unit1;
        context.beginPath();
        const sTop = this.top + 30;
        for (let i = 0; i < total; i++) {
          const move = this.scaleleft + this.gap * i;
          if (i === 0 || i % 5 === 0) {
            context.moveTo(move, sTop - 10);
          } else {
            context.moveTo(move, sTop);
          }
          context.lineTo(move, sTop + 10);
        }
        context.closePath();
        context.fillStrokeShape(shape);
      },
    });

    this.group.add(rect);
  }

  drawSlide() {
    const total = this.duration / this.unit1;
    const sTop = this.top + 60 + this.items.length * (this.itemHeight + 5);
    const slide = new Konva.Line({
      points: [this.left, sTop, this.left + total * this.gap, sTop],
      stroke: "#353535",
      strokeWidth: this.itemHeight,
    });

    this.group.add(slide);
    slide.zIndex(0);

    return slide;
  }

  drawPointer() {
    const _this = this;
    const pointer = new Konva.Group({
      draggable: true,
      dragBoundFunc: function (pos) {
        const x = pos.x - _this.offset > 0 ? pos.x : _this.offset;
        return {
          x: x,
          y: this.absolutePosition().y,
        };
      },
    });

    const pTop = this.top;

    const area = new Konva.Rect({
      x: this.scaleleft - 5,
      y: pTop,
      width: 10,
      height: this.height - pTop,
    });

    const line = new Konva.Line({
      points: [this.scaleleft, pTop + 16, this.scaleleft, this.height - pTop],
      stroke: "#ffffff",
      strokeWidth: 1,
    });

    const handle = new Konva.Line({
      points: [
        this.scaleleft - 6,
        pTop,
        this.scaleleft + 6,
        pTop,
        this.scaleleft + 6,
        pTop + 8,
        this.scaleleft,
        pTop + 16,
        this.scaleleft - 6,
        pTop + 8,
      ],
      stroke: "#ffffff",
      strokeWidth: 1,
      closed: true,
    });

    pointer.add(area);
    pointer.add(line);
    pointer.add(handle);

    pointer.zIndex(10);

    pointer.on("mouseenter", () => {
      this.stage.container().style.cursor = "ew-resize";
    });

    pointer.on("mouseleave", () => {
      this.stage.container().style.cursor = "default";
    });

    pointer.on("dragend", (e) => {
      const x = e.target.attrs.x;
      e.cancelBubble = true;
    });

    this.group.add(pointer);
  }

  static events: Events;

  static init(options: Props) {
    return new AnimationControl(options);
  }
}
