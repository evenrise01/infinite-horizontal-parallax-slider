//TODO: Check why the project title and project arrow isn't coming up on hover

'use client'
import { sliderData } from "./data/sliderData";
import { useEffect } from "react";

const config = {
  SCROLL_SPEED: 1.75,
  LEAP_FACTOR: 0.05,
  MAX_VELOCITY: 150,
};

const totalSliderCount = sliderData.length;

const state = {
  currentX: 0,
  targetX: 0,
  sliderWidth: 390,
  slides: [] as HTMLDivElement[],  // Fix: Properly type the slides array
  isDragging: false,
  startX: 0,
  lastX: 0,
  lastMouseX: 0,
  lastScrollTime: Date.now(),
  isMoving: false,
  velocity: 0,
  lastCurrentX: 0,
  dragDistance: 0,
  hasActuallyDragged: false,  // Fix: Changed from number to boolean
  isMobile: false,
};

function checkMobile() {
  state.isMobile = window.innerWidth < 1024;
}

function createSlideElement(index: number) {
  const slide = document.createElement("div");
  slide.className = "slide";

  if (state.isMobile) {
    slide.style.width = "175px";  // Fix: Removed comma operator
    slide.style.height = "250px";
  }

  const imageContainer = document.createElement("div");
  imageContainer.className = "slide-image";

  const img = document.createElement("img");
  const dataIndex = index % totalSliderCount;
  img.src = sliderData[dataIndex].img;
  img.alt = sliderData[dataIndex].title;

  const overlay = document.createElement("div");
  overlay.className = "slide-overlay";

  const title = document.createElement("p");
  title.className = "project-title";
  title.textContent = sliderData[dataIndex].title;

  const arrow = document.createElement("div");
  arrow.className = "project-arrow";
  arrow.innerHTML = `
  <svg viewBox = " 0 0 24 24">
  <path d = "M7 17L17 7M17 7HM17 7V17"/>
  </svg>
  `;

  // Attaching a clickEvent to the slide which we don't want to trigger if the user is in the middle of the drag
  slide.addEventListener("click", (e) => {
    e.preventDefault();
    if (state.dragDistance < 10 && !state.hasActuallyDragged) {
      window.location.href = sliderData[dataIndex].url;
    }
  });

  // Append all the child elements in order
  overlay.appendChild(title);
  overlay.appendChild(arrow);
  imageContainer.appendChild(img);
  slide.appendChild(imageContainer);
  slide.appendChild(overlay);

  return slide;
}

function initalizeSlides() {
  const track = document.querySelector(".slide-track");
  if (!track) return;
  track.innerHTML = "";  // Fix: Removed optional chaining
  state.slides = [];

  checkMobile();
  state.sliderWidth = state.isMobile ? 215 : 390;

  // How many slides we want to render since the slider is designed to loop infinitely
  const copies = 6;
  const totalSlides = totalSliderCount * copies;

  for (let i = 0; i < totalSlides; i++) {
    const slide = createSlideElement(i);
    track.appendChild(slide);
    state.slides.push(slide);
  }

  // Multiplying the original slideCount and shifting it left by 2 full loops which becomes the start value ie,. the center
  const startOffset = -(totalSliderCount * state.sliderWidth * 2);
  state.currentX = startOffset;
  state.targetX = startOffset;
}

function updateSliderPosition() {
  const track = document.querySelector(".slide-track") as HTMLElement;
  if (!track) return;

  const sequenceWidth = state.sliderWidth * totalSliderCount;

  if (state.currentX > -sequenceWidth * 1) {
    state.currentX -= sequenceWidth;
    state.targetX -= sequenceWidth;
  } else if (state.currentX < -sequenceWidth * 4) {  // Fix: Changed > to <
    state.currentX += sequenceWidth;
    state.targetX += sequenceWidth;
  }

  track.style.transform = `translate3d(${state.currentX}px, 0, 0)`;
}

function updateParallax() {
  const viewportCenter = window.innerWidth / 2;

  state.slides.forEach((slide) => {
    const img = slide.querySelector("img");
    if (!img) return;

    const slideRect = slide.getBoundingClientRect();

    if (slideRect.right < -500 || slideRect.left > window.innerWidth + 500) {
      return;
    }

    const slideCenter = slideRect.left + slideRect.width / 2;
    const distanceFromCenter = slideCenter - viewportCenter;
    const parallaxOffset = distanceFromCenter * -0.25;

    img.style.transform = `translateX(${parallaxOffset}px) scale(2.25)`;
  });
}

function updateMovingState() {
  state.velocity = Math.abs(state.currentX - state.lastCurrentX);
  state.lastCurrentX = state.currentX;

  const isSlowEnough = state.velocity < 0.05;  // Reduced threshold for more sensitive detection
  const hasBeenStillLongEnough = Date.now() - state.lastScrollTime > 150;  // Reduced time
  
  // Only consider it moving if BOTH conditions are false (velocity is high OR recent interaction)
  state.isMoving = !isSlowEnough || !hasBeenStillLongEnough;

  document.documentElement.style.setProperty(
    "--slider-moving",
    state.isMoving ? "1" : "0"
  );
}

function animate() {
  state.currentX += (state.targetX - state.currentX) * config.LEAP_FACTOR;

  updateMovingState();
  updateSliderPosition();
  updateParallax();

  requestAnimationFrame(animate);
}

function handleWheel(e: WheelEvent) {  // Fix: Added type
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    return;
  }

  e.preventDefault();
  state.lastScrollTime = Date.now();

  const scrollDelta = e.deltaY * config.SCROLL_SPEED;
  state.targetX -= Math.max(
    Math.min(scrollDelta, config.MAX_VELOCITY),
    -config.MAX_VELOCITY
  );
}

function handleTouchStart(e: TouchEvent) {  // Fix: Added type
  state.isDragging = true;
  state.startX = e.touches[0].clientX;
  state.lastX = state.targetX;
  state.dragDistance = 0;
  state.hasActuallyDragged = false;
  state.lastScrollTime = Date.now();
}

function handleTouchMove(e: TouchEvent) {  // Fix: Added type
  if (!state.isDragging) return;

  const deltaX = (e.touches[0].clientX - state.startX) * 1.5;
  state.targetX = state.lastX + deltaX;
  state.dragDistance = Math.abs(deltaX);

  if (state.dragDistance > 5) {
    state.hasActuallyDragged = true;
  }
  state.lastScrollTime = Date.now();
}

function handleTouchEnd() {
  state.isDragging = false;
  setTimeout(() => {
    state.hasActuallyDragged = false;
  }, 100);
}

function handleMouseDown(e: MouseEvent) {  // Fix: Added type
  e.preventDefault();
  state.isDragging = true;  // Fix: Changed to true
  state.startX = e.clientX;
  state.lastMouseX = e.clientX;
  state.lastX = state.targetX;
  state.dragDistance = 0;
  state.hasActuallyDragged = false;
  state.lastScrollTime = Date.now();
}

function handleMouseMove(e: MouseEvent) {  // Fix: Added type
  if (!state.isDragging) return;

  e.preventDefault();

  const deltaX = (e.clientX - state.lastMouseX) * 2;
  state.targetX += deltaX;
  state.lastMouseX = e.clientX;
  state.dragDistance += Math.abs(deltaX);

  if (state.dragDistance > 5) {
    state.hasActuallyDragged = true;
  }

  state.lastScrollTime = Date.now();
}

function handleMouseUp() {
  state.isDragging = false;
  setTimeout(() => {
    state.hasActuallyDragged = false;
  }, 100);
}

function handleResize() {
  initalizeSlides();
}

function initializeEventListener() {
  const slider = document.querySelector(".slider");

  slider?.addEventListener("wheel", handleWheel as EventListener, { passive: false });
  slider?.addEventListener("touchstart", handleTouchStart as EventListener);
  slider?.addEventListener("touchmove", handleTouchMove as EventListener);
  slider?.addEventListener("touchend", handleTouchEnd);
  slider?.addEventListener("mousedown", handleMouseDown as EventListener);
  slider?.addEventListener("mouseleave", handleMouseUp);

  slider?.addEventListener("dragstart", (e) => e.preventDefault());

  document.addEventListener("mousemove", handleMouseMove as EventListener);
  document.addEventListener("mouseup", handleMouseUp);
  window.addEventListener("resize", handleResize);  // Fix: Changed to window
}

function initializeSlider() {
  initalizeSlides();
  initializeEventListener();
  animate();
}

export default function Home() {
  useEffect(() => {
    initializeSlider();
  }, []);
  
  return (
    <>
      <nav>
        <div className="logo">
          <a href="#">Evenrise</a>
        </div>
        <div className="nav-links">
          <a href="#">Work</a>
          <a href="#">Studio</a>
          <a href="#">Contact</a>
        </div>
      </nav>

      <div className="slider">
        <div className="slide-track"></div>
      </div>

      <footer>
        <p>Experiment 0696</p>
        <p>Built by Evenrise</p>
      </footer>
    </>
  );
}