import { GLTFLoader } from "GLTFLoader";
import * as THREE from "three";

let dao_x = document.getElementById("dao_x");
let dao_y = document.getElementById("dao_y");
const divContainer = document.getElementById("webgl-container");

// Three.js 코드
let scene = new THREE.Scene();

let renderer = new THREE.WebGLRenderer({
	// canvas: divContainer.appendChild(renderer.domElement),
	antialias: true, // 부드러운 마감 처리지만 성능저하
});
// let renderer = new THREE.WebGL1Renderer({
// 	// canvas: divContainer.appendChild(renderer.domElement),
// 	antialias: true, // 부드러운 마감 처리지만 성능저하
// });
// three.js로 canvas 생성
let canvas = divContainer.appendChild(renderer.domElement);

console.log(canvas, "canvas");
const camera = new THREE.PerspectiveCamera(
	75,
	divContainer.clientWidth / divContainer.clientHeight,
	0.1,
	1000
);

camera.position.set(0.0, 0.0, 0.0);

// 캔버스의 스타일을 조작하는게 아니라 renderer의 사이즈를 조정하여 화면설정
// outerWidth 전체화면 윈도우버전 맥북에서 값찾아서 집어넣는 방법도 고려

// renderer.domElement는 캔버스 타입의 dom요소이다

// setPixelRatio는 윈도우의 픽셀크기를 설정한다
// renderer.setPixelRatio(window.devicePixelRatio);

// 창크기가 변경되면 발생하는 resize 메소드, dom컨테이너의 크기를 얻어와서 renderer , camera의 속성을 창크기에 맞게 설정해줌
function reSize() {
	const width = divContainer.clientWidth;
	const height = divContainer.clientHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);
}

// 창크기가 변경되면 발생하는 이벤트에 resize 메소드를 지정하여 renderer , camera이 창크기가 변경될때마다 속성값 재설정이 가능함
// bind를 이용하여 이 클래스를 연결시킴

// resize()를 한번은 무조건 실행시킴, renderer , camera의 속성을 창크기에 맞게 설정해줌
reSize();
window.addEventListener("resize", reSize);

scene.background = new THREE.Color("gray");
let light = new THREE.DirectionalLight(0x212121, 20);

light.position.set(0, 10, 10);

scene.add(light);

let light_Right = new THREE.DirectionalLight(0x212121, 100);

light_Right.position.set(1, 0, 0);

scene.add(light_Right);

let light_Left = new THREE.DirectionalLight(0x212121, 100);

light_Left.position.set(-1, 0, 0);

scene.add(light_Left);

// 3D모델인 GLTF 로더
let loader = new GLTFLoader();
let mixer = null;

let model_space = "./gltf/simple_bathroom_baking/scene.gltf";
let model_object = "./gltf/bridge_to_somewhere/scene.gltf";

// 로더로 렌더링하기
let load_Fun = (
	model,
	position_x,
	position_y,
	position_z,
	rotation_y,
	castShadow,
	receiveShadow
) => {
	loader.load(model, function (gltf) {
		scene.add(gltf.scene);

		function animate() {
			requestAnimationFrame(animate);
			// 1.5708 = 1rad

			// 오브젝트 자동회전용
			// gltf.scene.rotation.y = gltf.scene.rotation.y + 0.01;
			// gltf.scene.rotation.x = gltf.scene.rotation.x + 0.01;

			gltf.scene.rotation.y = 1.571 * rotation_y;

			gltf.scene.position.x = position_x;
			gltf.scene.position.y = position_y;
			gltf.scene.position.z = position_z;

			camera.position.x = -dao_x.textContent * 3.0;
			camera.position.y = -dao_y.textContent * 2.0;
			camera.position.z = 4;

			camera.lookAt(0, 0, 0);

			// console.log(camera.position, camera.rotation);
			renderer.render(scene, camera);
		}
		animate();
	});
};

load_Fun(model_space, 1.1, -1.4, 1, 0, true, true);
load_Fun(model_object, 0, 0, 1.5, 5.4, false, true);
// load_Fun(model_object, 1, 0, 1.5, 5.3, false, true);
