// 얻어야할것 3가지
// 이미지 공간의 2D 좌표 x y
// 세계 공간의 3D 좌표 x y z
// 초점, 중심 좌표 및 기울이기 매개변수와 같은 카메라 매개변수

// 이것을 기반으로
// 회전 벡터 —> 회전 행렬 —> 오일러 각(pitch,yaw,roll)을 만들면된다

const videoElement = document.getElementById("input_video");
const canvasElement = document.getElementById("output_canvas");
const eye_ball = document.getElementById("ball_2D");
const canvasCtx = canvasElement.getContext("2d");

// 비디오 너비,높이 추출
let video_variable = {
	height: canvasElement.height,
	width: canvasElement.width,
};

let { height, width } = video_variable;

let eye_To_camera = {
	eye_To_camera_x: null,
	eye_To_camera_y: null,
	eye_To_camera_y: null,
};

// 실제 얼굴의 xy좌표를 얻어오는 함수
function eyeTracking(eyeLandmark) {
	let dao_x = document.getElementById("dao_x");
	let dao_y = document.getElementById("dao_y");
	let dao_z = document.getElementById("dao_z");

	// 코 중간 부분인 168로 설정
	let eye_x = canvasElement.width * eyeLandmark[0][168].x.toFixed(5) + "px";

	let eye_y = canvasElement.height * eyeLandmark[0][168].y.toFixed(5) + "px";

	eye_ball.style.left = eye_x;
	eye_ball.style.top = eye_y;

	// Three.js의 카메라는 중앙이 0.0이니 컨버팅해주기
	// 적정 가중계수 곱하여 가속하거나 가감하기
	eye_To_camera.eye_To_camera_x = (eyeLandmark[0][168].x - 0.5).toFixed(5);
	eye_To_camera.eye_To_camera_y = (eyeLandmark[0][168].y - 0.5).toFixed(5);
	eye_To_camera.eye_To_camera_z = (eyeLandmark[0][168].z - 0.0).toFixed(5);

	dao_x.textContent = eye_To_camera.eye_To_camera_x;
	dao_y.textContent = eye_To_camera.eye_To_camera_y;
	dao_z.textContent = eye_To_camera.eye_To_camera_z;
	// console.log(eye_To_camera, 556);
}

function onResults(results) {
	let face_3d = [];
	let face_2d = [];
	let nose_2d = [];
	let nose_3d = [];

	let points = [1, 33, 61, 263, 291, 199];

	// 랜드마크 갯수
	let numRows = points.length;

	canvasCtx.save();
	canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
	canvasCtx.drawImage(
		results.image,
		0,
		0,
		canvasElement.width,
		canvasElement.height
	);

	let roll = 0;
	let pitch = 0;
	let yaw = 0;
	let x;
	let y;
	let z;

	try {
		if (results.multiFaceLandmarks) {
			// console.log(item, idx, 9);

			for (const landmarks of results.multiFaceLandmarks) {
				for (const point of points) {
					let point_true = landmarks[point];

					let face_landmarks_x = point_true.x * width;
					let face_landmarks_y = point_true.y * height;
					let face_landmarks_z = point_true.z;

					face_2d.push(face_landmarks_x);
					face_2d.push(face_landmarks_y);

					// Get the 3D Coordinates
					// https://google.github.io/mediapipe/solutions/face_mesh.html
					// http://www.bim-times.com/opencv/3.3.0/d9/d0c/group__calib3d.html#ga61585db663d9da06b68e70cfbf6a1eac
					face_3d.push(face_landmarks_x);
					face_3d.push(face_landmarks_y); //face_3d.push(face_landmarks_y * -1);
					face_3d.push(face_landmarks_z);

					drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {
						color: "blue",
						lineWidth: 1,
					});
					drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {
						color: "#FF3030",
					});
					drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {
						color: "#FF3030",
					});
					drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {
						color: "#FF3030",
					});
					drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {
						color: "#30FF30",
					});
					drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {
						color: "#30FF30",
					});
					drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {
						color: "#30FF30",
					});
					drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {
						color: "#E0E0E0",
					});
					drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {
						color: "#E0E0E0",
					});
				}
			}
			// console.log(face_3d, "face_3d");
			eyeTracking(results.multiFaceLandmarks);
		}
	} catch (error) {
		console.log(error);
	}

	// 3D model 랜드마크

	// 포인트s는 주요 랜드마크의 index번호 배열이다

	// 3D모델 행렬 64비트 , double, 1채널
	let modelPoints = cv.matFromArray(numRows, 3, cv.CV_64FC1, face_3d);

	// 2D 모델 행렬 64비트 , double, 1채널
	let imagePoints = cv.matFromArray(numRows, 2, cv.CV_64FC1, face_2d);

	// 초점, 중심 좌표 및 기울이기 매개변수와 같은 카메라 매개변수

	// 초점거리 계수
	let normalizedFocaleY = 1.0; // Logitech 922
	// let normalizedFocaleY = 1.28; // Logitech 922

	// 초점거리
	let focalLength = height * normalizedFocaleY;
	let s = 0.953571; // 기울이기 매개변수 0으로도 설정해보기

	// 카메라 행렬
	let cam_matrix = cv.matFromArray(3, 3, cv.CV_64FC1, [
		focalLength,
		s,
		width / 2,
		0,
		focalLength,
		height / 2,
		0,
		0,
		1,
	]);

	//The distortion parameters
	//let dist_matrix = cv.Mat.zeros(4, 1, cv.CV_64FC1); // 렌즈 왜곡이 없다고 가정할때 0대입하는듯
	// let k1 = 0.1318020374;
	// let k2 = -0.1550007612;
	// let p1 = -0.0071350401;
	// let p2 = -0.0096747708;

	// 감도조절

	let k1 = 0.0;
	let k2 = 0.0;
	let p1 = 0.0;
	let p2 = 0.0;
	let dist_matrix = cv.matFromArray(4, 1, cv.CV_64FC1, [k1, k2, p1, p2]);

	if (face_3d.length > 0 && face_2d.length > 0) {
		let rvec = cv.matFromArray(1, 3, cv.CV_64FC1, [0, 0, 0]); //new cv.Mat({ width: 1, height: 3 }, cv.CV_64FC1); // Output rotation vector
		let tvec = cv.matFromArray(1, 3, cv.CV_64FC1, [-100, 100, 1000]); //new cv.Mat({ width: 1, height: 3 }, cv.CV_64FC1); // Output translation vector

		let success = cv.solvePnP(
			modelPoints,
			imagePoints,
			cam_matrix,
			dist_matrix,
			rvec, // Output rotation vector
			tvec
		);

		// 벡터를 행렬로 변환

		if (success) {
			let rmat = cv.Mat.zeros(3, 3, cv.CV_64FC1);
			const jaco = new cv.Mat();

			// Rodrigues를 이용해 회전 벡터를 행렬로 변환
			cv.Rodrigues(rvec, rmat, jaco); // jacobian	Optional output Jacobian matrix

			// 회전행렬을 이용해 오일러 각도를 얻어야하는데 RQDecomp3x3함수가 없음으로 오일러 각도 계산 알고리즘을 이용한다

			var sy = Math.sqrt(
				rmat.data64F[0] * rmat.data64F[0] + rmat.data64F[3] * rmat.data64F[3]
			);

			var singular = sy < 1e-6;

			if (!singular) {
				x = Math.atan2(rmat.data64F[7], rmat.data64F[8]);
				y = Math.atan2(-rmat.data64F[6], sy);
				z = Math.atan2(rmat.data64F[3], rmat.data64F[0]);
			} else {
				x = Math.atan2(-rmat.data64F[5], rmat.data64F[4]);
				// x = Math.atan2(rmat.data64F[1], rmat.data64F[2]);
				y = Math.atan2(-rmat.data64F[6], sy);
				z = 0;
			}

			roll = y;
			pitch = x;
			yaw = z;

			var worldPoints = cv.matFromArray(5, 3, cv.CV_64FC1, [
				nose_3d[0],
				nose_3d[1],
				nose_3d[2] * 3000, //
				nose_3d[0] + 50,
				nose_3d[1],
				nose_3d[2], //
				nose_3d[0],
				nose_3d[1] + 50,
				nose_3d[2], //
				nose_3d[0],
				nose_3d[1],
				nose_3d[2] - 50,
				face_3d[3],
				face_3d[4],
				face_3d[5],
			]);

			var imagePointsProjected = new cv.Mat(
				{ width: 5, height: 2 },
				cv.CV_64FC1
			);
			cv.projectPoints(
				worldPoints,
				rvec,
				tvec,
				cam_matrix,
				dist_matrix,
				imagePointsProjected,
				jaco
			);

			// Draw pose
			canvasCtx.lineWidth = 5;

			canvasCtx.strokeStyle = "blue";
			canvasCtx.beginPath();
			canvasCtx.moveTo(nose_2d[0], nose_2d[1]);
			canvasCtx.lineTo(
				imagePointsProjected.data64F[0],
				imagePointsProjected.data64F[1]
			);
			canvasCtx.closePath();
			canvasCtx.stroke();

			canvasCtx.strokeStyle = "red";
			canvasCtx.beginPath();
			canvasCtx.moveTo(nose_2d[0], nose_2d[1]);
			canvasCtx.lineTo(
				imagePointsProjected.data64F[2],
				imagePointsProjected.data64F[3]
			);
			canvasCtx.closePath();
			canvasCtx.stroke();

			canvasCtx.strokeStyle = "green";
			canvasCtx.beginPath();
			canvasCtx.moveTo(nose_2d[0], nose_2d[1]);
			canvasCtx.lineTo(
				imagePointsProjected.data64F[4],
				imagePointsProjected.data64F[5]
			);
			canvasCtx.closePath();
			canvasCtx.stroke();

			canvasCtx.fillStyle = "yellow";
			canvasCtx.rect(
				imagePointsProjected.data64F[2] - 5,
				imagePointsProjected.data64F[3] - 5,
				10,
				10
			);
			canvasCtx.fill();

			jaco.delete();
			imagePointsProjected.delete();
		} // if문 닫힘

		canvasCtx.fillStyle = "yellow";
		canvasCtx.font = "25px Arial";
		canvasCtx.fillText(
			"roll: " + (180.0 * (roll / Math.PI)).toFixed(3) + " deg",
			//"roll: " + roll.toFixed(2),
			width * 0.8,
			50
		);
		canvasCtx.fillText(
			"pitch: " + (180.0 * (pitch / Math.PI)).toFixed(3) + " deg",
			//"pitch: " + pitch.toFixed(2),
			width * 0.8,
			100
		);
		canvasCtx.fillText(
			"yaw: " + (1000 * 180.0 * (yaw / Math.PI)).toFixed(2) + " deg",
			//"yaw: " + yaw.toFixed(3),
			width * 0.8,
			150
		);
		canvasCtx.fillText(
			"rvec: " +
				(180.0 * (rvec.data64F[0] / Math.PI)).toFixed(3) +
				", " +
				(180.0 * (rvec.data64F[1] / Math.PI)).toFixed(3) +
				", " +
				(180.0 * (rvec.data64F[2] / Math.PI)).toFixed(3),
			width * 0.01,
			50
		);
		canvasCtx.fillText(
			"tvec: " +
				tvec.data64F[0].toFixed(3) +
				", " +
				tvec.data64F[1].toFixed(3) +
				", " +
				tvec.data64F[2].toFixed(3),
			width * 0.01,
			100
		);

		canvasCtx.fillText(
			"rot xyz: " + x.toFixed(3) + ", " + y.toFixed(3) + ", " + z.toFixed(3),
			width * 0.01,
			200
		);

		// TODO Check rmat
		//console.log(rmat.data64F);

		rvec.delete();
		tvec.delete();

		// 오일러 각도 계산 알고리즘
	}

	canvasCtx.restore();
} // onResults 함수끝나는지점

// 얼굴인식의 세부 옵션설정
const faceMesh = new FaceMesh({
	locateFile: (file) => {
		return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
	},
});
faceMesh.setOptions({
	maxNumFaces: 1,
	refineLandmarks: false,
	triangulateMesh: false, // 성능 많이 잡아먹음
	minDetectionConfidence: 0.5,
	minTrackingConfidence: 0.5,
});

faceMesh.onResults(onResults);

// 화면크기 설정
const camera = new Camera(videoElement, {
	onFrame: async () => {
		await faceMesh.send({ image: videoElement });
	},
	width: 640,
	height: 480,
});
camera.start();

// export default eye_To_camera;

// // 얻어야할것 3가지
// // 이미지 공간의 2D 좌표 x y
// // 세계 공간의 3D 좌표 x y z
// // 초점, 중심 좌표 및 기울이기 매개변수와 같은 카메라 매개변수

// // 이것을 기반으로
// // 회전 벡터 —> 회전 행렬 —> 오일러 각(pitch,yaw,roll)을 만들면된다

// // let eye_To_camera = { eye_To_camera_x: null, eye_To_camera_y: null };

// // console.log(eye_To_camera);

// function onOpenCvReady() {
// 	cv["onRuntimeInitialized"] = () => {
// 		const videoElement = document.getElementById("input_video");
// 		const canvasElement = document.getElementById("output_canvas");
// 		const eye_ball = document.getElementById("ball_2D");
// 		const canvasCtx = canvasElement.getContext("2d");

// 		// 비디오 너비,높이 추출
// 		let video_variable = { height: canvasElement.height, width: canvasElement.width };

// 		let { height, width } = video_variable;

// 		let eye_To_camera = { eye_To_camera_x: null, eye_To_camera_y: null };

// 		// 실제 얼굴의 xy좌표를 얻어오는 함수
// 		function eyeTracking(eyeLandmark) {
// 			// 코 중간 부분인 168로 설정
// 			let eye_x = canvasElement.width * eyeLandmark[0][168].x.toFixed(5) + "px";

// 			let eye_y =
// 				canvasElement.height * eyeLandmark[0][168].y.toFixed(5) + "px";

// 			eye_ball.style.left = eye_x;
// 			eye_ball.style.top = eye_y;

// 			// Three.js의 카메라는 중앙이 0.0이니 컨버팅해주기
// 			// 적정 가중계수 곱하여 가속하거나 가감하기
// 			eye_To_camera.eye_To_camera_x = Number(
// 				(eyeLandmark[0][168].x - 0.5).toFixed(5)
// 			);
// 			eye_To_camera.eye_To_camera_y = Number(
// 				(eyeLandmark[0][168].y - 0.5).toFixed(5)
// 			);

// 			// console.log(eye_To_camera, "eye_To_camera");
// 			// console.log(eyeLandmark[0][168].x.toFixed(5));
// 			// console.log(eyeLandmark[0][168].x.toFixed(5));
// 		}

// 		function onResults(results) {
// 			let face_3d = [];
// 			let face_2d = [];
// 			let nose_2d = [];
// 			let nose_3d = [];

// 			let points = [1, 33, 61, 263, 291, 199];

// 			// 랜드마크 갯수
// 			let numRows = points.length;

// 			canvasCtx.save();
// 			canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
// 			canvasCtx.drawImage(
// 				results.image,
// 				0,
// 				0,
// 				canvasElement.width,
// 				canvasElement.height
// 			);

// 			let roll = 0;
// 			let pitch = 0;
// 			let yaw = 0;
// 			let x;
// 			let y;
// 			let z;

// 			try {
// 				if (results.multiFaceLandmarks) {
// 					// console.log(item, idx, 9);

// 					for (const landmarks of results.multiFaceLandmarks) {
// 						for (const point of points) {
// 							let point_true = landmarks[point];

// 							let face_landmarks_x = point_true.x * width;
// 							let face_landmarks_y = point_true.y * height;
// 							let face_landmarks_z = point_true.z;

// 							face_2d.push(face_landmarks_x);
// 							face_2d.push(face_landmarks_y);

// 							// Get the 3D Coordinates
// 							// https://google.github.io/mediapipe/solutions/face_mesh.html
// 							// http://www.bim-times.com/opencv/3.3.0/d9/d0c/group__calib3d.html#ga61585db663d9da06b68e70cfbf6a1eac
// 							face_3d.push(face_landmarks_x);
// 							face_3d.push(face_landmarks_y); //face_3d.push(face_landmarks_y * -1);
// 							face_3d.push(face_landmarks_z);

// 							drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {
// 								color: "#FF3030",
// 							});
// 							drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {
// 								color: "#B2050E",
// 							});
// 							drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {
// 								color: "#B2050E",
// 							});

// 							drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {
// 								color: "#30FF30",
// 							});
// 							drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {
// 								color: "#17C6A3",
// 							});
// 							drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {
// 								color: "#17C6A3",
// 							});

// 							drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {
// 								color: "#E0E0E0",
// 							});
// 							drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {
// 								color: "#E0E0E0",
// 							});
// 						}
// 					}
// 					// console.log(face_3d, "face_3d");
// 					eyeTracking(results.multiFaceLandmarks);
// 				}
// 			} catch (error) {
// 				console.log(error);
// 			}

// 			// 3D model 랜드마크

// 			// 포인트s는 주요 랜드마크의 index번호 배열이다

// 			// 3D모델 행렬 64비트 , double, 1채널
// 			let modelPoints = cv.matFromArray(numRows, 3, cv.CV_64FC1, face_3d);

// 			// 2D 모델 행렬 64비트 , double, 1채널
// 			let imagePoints = cv.matFromArray(numRows, 2, cv.CV_64FC1, face_2d);

// 			// 초점, 중심 좌표 및 기울이기 매개변수와 같은 카메라 매개변수

// 			// 초점거리 계수
// 			let normalizedFocaleY = 1.0; // Logitech 922
// 			// let normalizedFocaleY = 1.28; // Logitech 922

// 			// 초점거리
// 			let focalLength = height * normalizedFocaleY;
// 			let s = 0.953571; // 기울이기 매개변수 0으로도 설정해보기

// 			// 카메라 행렬
// 			let cam_matrix = cv.matFromArray(3, 3, cv.CV_64FC1, [
// 				focalLength,
// 				s,
// 				width / 2,
// 				0,
// 				focalLength,
// 				height / 2,
// 				0,
// 				0,
// 				1,
// 			]);

// 			//The distortion parameters
// 			//let dist_matrix = cv.Mat.zeros(4, 1, cv.CV_64FC1); // 렌즈 왜곡이 없다고 가정할때 0대입하는듯
// 			// let k1 = 0.1318020374;
// 			// let k2 = -0.1550007612;
// 			// let p1 = -0.0071350401;
// 			// let p2 = -0.0096747708;

// 			// 감도조절

// 			let k1 = 0.0;
// 			let k2 = 0.0;
// 			let p1 = 0.0;
// 			let p2 = 0.0;
// 			let dist_matrix = cv.matFromArray(4, 1, cv.CV_64FC1, [k1, k2, p1, p2]);

// 			if (face_3d.length > 0 && face_2d.length > 0) {
// 				let rvec = cv.matFromArray(1, 3, cv.CV_64FC1, [0, 0, 0]); //new cv.Mat({ width: 1, height: 3 }, cv.CV_64FC1); // Output rotation vector
// 				let tvec = cv.matFromArray(1, 3, cv.CV_64FC1, [-100, 100, 1000]); //new cv.Mat({ width: 1, height: 3 }, cv.CV_64FC1); // Output translation vector

// 				let success = cv.solvePnP(
// 					modelPoints,
// 					imagePoints,
// 					cam_matrix,
// 					dist_matrix,
// 					rvec, // Output rotation vector
// 					tvec
// 				);

// 				// 벡터를 행렬로 변환

// 				if (success) {
// 					let rmat = cv.Mat.zeros(3, 3, cv.CV_64FC1);
// 					const jaco = new cv.Mat();

// 					// Rodrigues를 이용해 회전 벡터를 행렬로 변환
// 					cv.Rodrigues(rvec, rmat, jaco); // jacobian	Optional output Jacobian matrix

// 					// 회전행렬을 이용해 오일러 각도를 얻어야하는데 RQDecomp3x3함수가 없음으로 오일러 각도 계산 알고리즘을 이용한다

// 					var sy = Math.sqrt(
// 						rmat.data64F[0] * rmat.data64F[0] +
// 							rmat.data64F[3] * rmat.data64F[3]
// 					);

// 					var singular = sy < 1e-6;

// 					// console.log("rmat.data64F[0]", rmat.data64F);

// 					if (!singular) {
// 						//console.log("!singular");
// 						x = Math.atan2(rmat.data64F[7], rmat.data64F[8]);
// 						y = Math.atan2(-rmat.data64F[6], sy);
// 						z = Math.atan2(rmat.data64F[3], rmat.data64F[0]);
// 					} else {
// 						x = Math.atan2(-rmat.data64F[5], rmat.data64F[4]);
// 						// x = Math.atan2(rmat.data64F[1], rmat.data64F[2]);
// 						y = Math.atan2(-rmat.data64F[6], sy);
// 						z = 0;
// 					}

// 					roll = y;
// 					pitch = x;
// 					yaw = z;

// 					var worldPoints = cv.matFromArray(5, 3, cv.CV_64FC1, [
// 						nose_3d[0],
// 						nose_3d[1],
// 						nose_3d[2] * 3000, //
// 						nose_3d[0] + 50,
// 						nose_3d[1],
// 						nose_3d[2], //
// 						nose_3d[0],
// 						nose_3d[1] + 50,
// 						nose_3d[2], //
// 						nose_3d[0],
// 						nose_3d[1],
// 						nose_3d[2] - 50,
// 						face_3d[3],
// 						face_3d[4],
// 						face_3d[5],
// 					]);

// 					var imagePointsProjected = new cv.Mat(
// 						{ width: 5, height: 2 },
// 						cv.CV_64FC1
// 					);
// 					cv.projectPoints(
// 						worldPoints,
// 						rvec,
// 						tvec,
// 						cam_matrix,
// 						dist_matrix,
// 						imagePointsProjected,
// 						jaco
// 					);

// 					// Draw pose
// 					canvasCtx.lineWidth = 5;

// 					canvasCtx.strokeStyle = "blue";
// 					canvasCtx.beginPath();
// 					canvasCtx.moveTo(nose_2d[0], nose_2d[1]);
// 					canvasCtx.lineTo(
// 						imagePointsProjected.data64F[0],
// 						imagePointsProjected.data64F[1]
// 					);
// 					canvasCtx.closePath();
// 					canvasCtx.stroke();

// 					canvasCtx.strokeStyle = "red";
// 					canvasCtx.beginPath();
// 					canvasCtx.moveTo(nose_2d[0], nose_2d[1]);
// 					canvasCtx.lineTo(
// 						imagePointsProjected.data64F[2],
// 						imagePointsProjected.data64F[3]
// 					);
// 					canvasCtx.closePath();
// 					canvasCtx.stroke();

// 					canvasCtx.strokeStyle = "green";
// 					canvasCtx.beginPath();
// 					canvasCtx.moveTo(nose_2d[0], nose_2d[1]);
// 					canvasCtx.lineTo(
// 						imagePointsProjected.data64F[4],
// 						imagePointsProjected.data64F[5]
// 					);
// 					canvasCtx.closePath();
// 					canvasCtx.stroke();

// 					canvasCtx.fillStyle = "yellow";
// 					canvasCtx.rect(
// 						imagePointsProjected.data64F[2] - 5,
// 						imagePointsProjected.data64F[3] - 5,
// 						10,
// 						10
// 					);
// 					canvasCtx.fill();

// 					jaco.delete();
// 					imagePointsProjected.delete();
// 				} // if문 닫힘

// 				canvasCtx.fillStyle = "yellow";
// 				canvasCtx.font = "25px Arial";
// 				canvasCtx.fillText(
// 					"roll: " + (180.0 * (roll / Math.PI)).toFixed(3) + " deg",
// 					//"roll: " + roll.toFixed(2),
// 					width * 0.8,
// 					50
// 				);
// 				canvasCtx.fillText(
// 					"pitch: " + (180.0 * (pitch / Math.PI)).toFixed(3) + " deg",
// 					//"pitch: " + pitch.toFixed(2),
// 					width * 0.8,
// 					100
// 				);
// 				canvasCtx.fillText(
// 					"yaw: " + (1000 * 180.0 * (yaw / Math.PI)).toFixed(2) + " deg",
// 					//"yaw: " + yaw.toFixed(3),
// 					width * 0.8,
// 					150
// 				);
// 				canvasCtx.fillText(
// 					"rvec: " +
// 						(180.0 * (rvec.data64F[0] / Math.PI)).toFixed(3) +
// 						", " +
// 						(180.0 * (rvec.data64F[1] / Math.PI)).toFixed(3) +
// 						", " +
// 						(180.0 * (rvec.data64F[2] / Math.PI)).toFixed(3),
// 					width * 0.01,
// 					50
// 				);
// 				canvasCtx.fillText(
// 					"tvec: " +
// 						tvec.data64F[0].toFixed(3) +
// 						", " +
// 						tvec.data64F[1].toFixed(3) +
// 						", " +
// 						tvec.data64F[2].toFixed(3),
// 					width * 0.01,
// 					100
// 				);

// 				canvasCtx.fillText(
// 					"rot xyz: " +
// 						x.toFixed(3) +
// 						", " +
// 						y.toFixed(3) +
// 						", " +
// 						z.toFixed(3),
// 					width * 0.01,
// 					200
// 				);

// 				// TODO Check rmat
// 				//console.log(rmat.data64F);

// 				rvec.delete();
// 				tvec.delete();

// 				// 오일러 각도 계산 알고리즘
// 			}

// 			canvasCtx.restore();
// 		} // onResults 함수끝나는지점

// 		// 얼굴인식의 세부 옵션설정
// 		const faceMesh = new FaceMesh({
// 			locateFile: (file) => {
// 				return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
// 			},
// 		});
// 		faceMesh.setOptions({
// 			maxNumFaces: 1,
// 			refineLandmarks: false,
// 			triangulateMesh: false, // 성능 많이 잡아먹음
// 			minDetectionConfidence: 0.5,
// 			minTrackingConfidence: 0.5,
// 		});

// 		faceMesh.onResults(onResults);

// 		// 화면크기 설정
// 		const camera = new Camera(videoElement, {
// 			onFrame: async () => {
// 				await faceMesh.send({ image: videoElement });
// 			},
// 			width: 640,
// 			height: 480,
// 		});
// 		camera.start();
// 	};
// }
