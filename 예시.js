import * as THREE from "three";
import { GLTFLoader } from "GLTFLoader";

let dao_x = document.getElementById("dao_x");
let dao_y = document.getElementById("dao_y");

class App {
	constructor() {
		// this._ㅁㅁㅁ 형테는 이 클래스 내부에서만 사용되는 private 필드와 메소드를 선언하는 것이다

		const divContainer = document.querySelector("#webgl-container");
		this._divContainer = divContainer;

		const renderer = new THREE.WebGLRenderer({ antialias: true });

		// setPixelRatio는 윈도우의 픽셀크기를 설정한다
		renderer.setPixelRatio(window.devicePixelRatio);

		// renderer.domElement는 캔버스 타입의 dom요소이다
		divContainer.appendChild(renderer.domElement);
		this._renderer = renderer;

		const scene = new THREE.Scene();
		this._scene = scene;

		// 카메라 객체를 구성하는 함수 호출
		this._setupCamera();

		// 광원을 설정하는 함수 호출
		this._setupLight();

		// 3차원 모델을 설정하는 함수 호출
		this._setupModel();

		// 창크기가 변경되면 발생하는 이벤트에 resize 메소드를 지정하여 renderer , camera이 창크기가 변경될때마다 속성값 재설정이 가능함
		// bind를 이용하여 이 클래스를 연결시킴
		window.onresize = this.resize.bind(this);
		// resize()를 한번은 무조건 실행시킴, renderer , camera의 속성을 창크기에 맞게 설정해줌
		this.resize();

		let loader = new GLTFLoader();
		loader.load("head_planes_reference/scene.gltf", function (gltf) {
			scene.add(gltf.scene);
			function animate() {
				requestAnimationFrame(animate);
				gltf.scene.rotation.y += -0.1;
				renderer.render(scene, camera);
			}
			animate();
		});

		// render 메소드로 3D 그래픽을 만들어주는 함수 반복호출 !! 주의 renderer이랑 혼동 , bind를 사용하는 이유는 이 클래스의 객체를 가르키기위함
		requestAnimationFrame(this.render.bind(this));
	}

	// 3D 그래픽출력영역의 가로 세로 크기로 카메라객체를 생성함
	_setupCamera() {
		const width = this._divContainer.clientWidth;
		const height = this._divContainer.clientHeight;
		const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
		camera.position.z = 2.5;

		this._camera = camera;
	}

	// 광원 색상 세기 위치값을 설정해 광원을 생성함, 광원객체는 scene객체의 구성요소로 추가
	_setupLight() {
		const color = 0xffffff;
		const intensity = 1;
		const light = new THREE.DirectionalLight(color, intensity);
		light.position.set(-1, 2, 4);
		this._scene.add(light);
	}

	//  geometry , material객체를 통해 mesh모델 객체를 생성함
	_setupModel() {
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshPhongMaterial({ color: 0x44a88 });

		// mesh 객체 생성
		const cube = new THREE.Mesh(geometry, material);

		this._scene.add(cube);
		this._cube = cube;
	}

	// 창크기가 변경되면 발생하는 resize 메소드, dom컨테이너의 크기를 얻어와서 renderer , camera의 속성을 창크기에 맞게 설정해줌
	resize() {
		const width = this._divContainer.clientWidth;
		const height = this._divContainer.clientHeight;

		this._camera.aspect = width / height;

		this._camera.updateProjectionMatrix();

		this._renderer.setSize(width, height);
	}

	// D 그래픽을 만들어주는 함수
	// time은 렌더링 첫 시작이후 경과값이다(ms단위)
	render(time) {
		// console.log(111);
		// 카메라의 시점으로 렌더링하라는 코드
		this._renderer.render(this._scene, this._camera);
		this.update(time);
		requestAnimationFrame(this.render.bind(this));
	}

	// ms단위를 초단위로 변환해 모델을 갱신시키는 메소드
	update(time) {
		time *= 0.001; // secondunit
		// console.log(time);
		// // // 큐브회전 애니메이션 초 단위
		// this._cube.rotation.x = time * 0.5;
		// this._cube.rotation.y = time * 0.5;
		// this._cube.rotation.z = time * 0.5;

		// this._camera.position.x = -dao_x.textContent;
		// this._camera.position.x = 0;
		// this._camera.position.x = -(dao_x.textContent * 4).toFixed(10)
		// this._camera.position.y = -(dao_y.textContent * 4).toFixed(10);

		// this._camera.position.x = -dao_x.textContent * 2;
		// this._camera.position.y = -dao_y.textContent * 4;
		// this._camera.position.x = this._camera.position.x - 0.001;

		this._camera.lookAt(new THREE.Vector3(0, 0, 0));
		console.log(this._camera.position.x);
		// this._camera.position.x = this._camera.position.x -= 0.01;
		// console.log(this._camera.position);
	}
}

window.onload = function () {
	new App();
};
