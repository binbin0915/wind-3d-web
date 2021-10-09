import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {CSS2DRenderer} from "three/examples/jsm/renderers/CSS2DRenderer";
import {CSS2DObject} from "three/examples/jsm/renderers/CSS2DRenderer";
import React from "react";
import {PerspectiveCamera, WebGLRenderer, Scene, DirectionalLight, Clock} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import * as dat from 'dat.gui';
import {RenderPass, EffectComposer, OutlinePass} from "three-outlinepass";
import './index.css';
import equipment from '../../assets/3d-gltf-model/equipment.glb';
import turbine from '../../assets/3d-gltf-model/turbine.glb';
import plane from '../../assets/3d-gltf-model/plane.glb';
import smoke from '../../assets/textures/particles/smoke-1.png'


//需要使用json-loader模块，如果你是使用create-react-app来构建项目，那么该模块已经包含在内，只需要用import像引入组件那样引入json文件即可
import labelData from '../../assets/labelData/labelData.json'

const scale = 0.0003

let size = {
    w: window.innerWidth,
    h: window.innerHeight,
}

let timer = null
let cloudParticles = []

let flashAnimatation = null;

let renderer = new WebGLRenderer({antialias: true, alpha: true});
renderer.shadowMap.enabled = true;
renderer.setSize(size.w, size.h);

export default class Turbine extends React.Component {
    myRef = React.createRef();
    equipmentLabelRef = React.createRef();

    constructor(props) {
        super(props);
        this.wholeGroup = new THREE.Group();
        this.turbineLabel = null;
        this.equipment = null;
        this.wireframe = null;
        this.metal = null;
        this.matrixTurbine = null;
        this.turbineAnimation = null;
        this.equipmentMaterialMap = new Map();
        this.plane = null;
        this.mixers = new Map();
        this.CSSRender = new CSS2DRenderer();
        this.renderer = renderer;
        this.rendererSize = size;
        this.rendererDom = renderer.domElement;
        this.scene = new Scene();
        this.camera = null;
        this.compose = null;
        this.clock = new Clock();
        this.setIntervalAlarm = null;
        this.setTimeoutAlarm = null;
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.equipmentLabelData = labelData.labelData[0];
        this.nowLabelData = {
            cn: "无数据",
            en: "No data",
            list: [
                    {
                        name: "无数据",
                        value: "",
                        unit: "无数据"
                    }
                ]
        };


    }

    state = {
        showTurbineMtl: false,
        showEquipmentAlarm: false,
        labelShow:false,
        speed: 5,
    }

    componentDidMount() {
        this.camera = this.createdCamera(30, size.w, size.h, [-4, -3.5, 4], 1)
        this.cameraControl(this.camera)
        this.createdLight()
        this.loadEquipment();
        this.loadPlane();
        this.loadTurbine();
        this.renderSpeed()
        this.loadGui()
        this.createTurbineLabel()
        this.mounted()
        this.gui.add(this.controlsGui, '天气');
        this.gui.add(this.controlsGui, '材质');
        this.gui.add(this.controlsGui, "风速", 1, 30, 0.5)
        this.gui.add(this.controlsGui, '仅部件');
        this.gui.add(this.controlsGui, '部件损坏告警');

        document.addEventListener("click", this.onPointerClick);

    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // 改变风机转速部分，必须使用防抖或者节流
        if (prevState.speed !== this.state.speed) {
            this.loadTurbine();
        }
    }


    loadTurbine = () => {
        const loader = new GLTFLoader()
        if (this.scene.getObjectByName('turbine')) {
            let removeTurbine = this.scene.getObjectByName('turbine')
            this.scene.remove(removeTurbine)
        }

        loader.load(turbine, object => {
            this.matrixTurbine = object;
            let mesh = object.scene;
            mesh.name = 'turbine'
            // this.mesh = mesh;
            this.metal = mesh.getObjectByName("颜色材质");
            this.wireframe = mesh.getObjectByName("线框材质");
            this.metal.visible = this.state.showTurbineMtl;
            this.turbineAnimation = object.animations;
            // 改变风机转速的部分
            this.matrixTurbine.animations[0].tracks[1].times = this.changeArr(object.animations[0].tracks[1].times)// 控制透明的风机动画速度
            this.matrixTurbine.animations[0].tracks[0].times = this.changeArr(object.animations[0].tracks[0].times) // 控制有材质的风机动画速度
            this.matrixTurbine.animations[0].duration = 6 / (this.controlsGui.风速 / 5)

            mesh.scale.set(scale, scale, scale);
            mesh.position.set(0, -2, 0);
            this.scene.add(mesh);
            this.changeAnimation(mesh, "Anim_0");
        })
    }

    changeArr = (arr) => {
        return arr.map((a) => a / (this.controlsGui.风速 / 5))
    }

    loadEquipment = () => {
        let loader = new GLTFLoader();
        loader.load(equipment, object => {
            let mesh = object.scene;
            mesh.name = 'equipment';
            this.equipment = mesh;
            mesh.traverse(child => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    this.equipmentMaterialMap.set(child.name, child); // Map 存储各个部件
                }
            });
            mesh.scale.set(scale, scale, scale);
            mesh.position.set(0, -2, 0);
            this.scene.add(mesh);

        });
    }

    // 加载地板
    loadPlane = () => {
        let loader = new GLTFLoader();
        loader.load(plane, object => {
            let mesh = object.scene;
            mesh.scale.set(scale, scale, scale);
            mesh.position.set(0, -2, 0);
            this.scene.add(mesh);
        });
    }

    // 闪电乌云特效
    loadFlash = () => {
        const wholeFlashGroup = new THREE.Group();
        wholeFlashGroup.name = 'flash'
        const ambient = new THREE.AmbientLight(0x555555);
        wholeFlashGroup.add(ambient);
        const directionalLight = new THREE.DirectionalLight(0xffeedd);
        directionalLight.position.set(0, 0, 1);
        wholeFlashGroup.add(directionalLight);
        const flash = new THREE.PointLight(0xe0ffff, 10000, 0, 2);
        flash.position.set(100, 100, -110);
        wholeFlashGroup.add(flash);
        this.myRef.current.appendChild(renderer.domElement);

        let loader = new THREE.TextureLoader();
        loader.load(smoke, (texture) => {
            const cloudGeo = new THREE.PlaneBufferGeometry(400, 400);
            const cloudMaterial = new THREE.MeshLambertMaterial({//一种用于无光泽表面的材料，没有镜面高光。该材料使用基于非物理的朗伯模型来计算反射率
                map: texture,
                transparent: true
            });
            for (let p = 0; p < 5; p++) {
                let cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
                cloud.position.set(
                    Math.random() * 10 + 90,
                    Math.random() * 20 + 15,
                    -Math.random() * 50 - 80
                );
                cloud.rotation.x = 1.16;
                cloud.rotation.y = -0.12;
                cloud.rotation.z = Math.random() * 360;
                cloud.material.opacity = 0.4;
                cloudParticles.push(cloud);
                wholeFlashGroup.add(cloud);
            }
            this.scene.add(wholeFlashGroup)
            animate();
        });

        const animate = () => {
            cloudParticles.forEach(p => { // cloudParticles 是包含 数个乌云Mesh 的数组
                p.rotation.z -= 0.002;
            });
            if (Math.random() > 0.90 || flash.power > 220) {
                if (flash.power < 100)
                    flash.position.set(
                        Math.random() * 30 + 80,
                        Math.random() * 20 + 10,
                        Math.random() * 3 - 100
                    );
                flash.power = 50 + Math.random() * 500;
            }
            flashAnimatation = requestAnimationFrame(animate);
        }
    }


    //添加和改变风机旋转动画
    changeAnimation = (turbine, animationName) => {
        const animations = this.matrixTurbine.animations;
        // 用于在场景中的特定对象上播放动画。
        // 当场景中的多个对象独立进行动画处理时，每个对象可以使用一个 AnimationMixer
        const mixer = new THREE.AnimationMixer(turbine);
        // AnimationClip 是一组可重复使用的关键帧轨迹，代表一个动画
        const clip = THREE.AnimationClip.findByName(
            animations,
            animationName
        );
        const key = "AA";
        if (clip) {
            const action = mixer.clipAction(clip);
            action.play();
            this.mixers.set(key, mixer);
        } else {
            this.mixers.delete(key);
        }
    }


    createdCamera = (fov, width, height, position, zoom) => {
        let [x, y, z] = position
        const camera = new PerspectiveCamera(fov, width / height, 0.1, 1000, zoom);

        camera.position.set(x, y, z);
        return camera
    }


    createdLight = () => {
        const arr = [
            [100, 100, 100],
            [-100, 100, 100],
            [100, -100, 100]
        ];
        arr.forEach(lightArr => {
            let spotLight = new DirectionalLight(0xffffff, 3);
            let [x, y, z] = lightArr
            spotLight.position.set(x, y, z);
            this.scene.add(spotLight);
        });
    }

    createAlarm = () => {  // 设备中每个部件随机变红，显示坏掉的警告
        const nameList = [
            "pasted__extrudedSurface2",
            "pasted__extrudedSurface8",
            "pasted__group59_pCylinder158",
            "pasted__pCube70",
            "pasted__pCube97",
            "polySurface152",
            "polySurface156",
            "polySurface230",
            "polySurface258"
        ];
        if (this.state.showEquipmentAlarm === true) {
            this.setIntervalAlarm = setInterval(() => {
                const random = parseInt(Math.random() * 9);
                const equipment = this.equipmentMaterialMap.get(
                    nameList[random]
                );
                if (equipment) {
                    equipment.material.emissive.setHex(equipment.currentHex);
                }
                equipment.currentHex = equipment.material.emissive.getHex();
                equipment.material.emissive.setHex(0xff0000); // 材料的自发光（光）颜色，本质上是一种不受其他照明影响的纯色
                this.setTimeoutAlarm = setTimeout(() => {
                    if (equipment)
                        equipment.material.emissive.setHex(
                            equipment.currentHex  // 变成红色后设置一个定时器，过了四秒恢复设备原有颜色
                        );
                }, 3000);
            }, 2000);

        } else {
            nameList.forEach((equipEle) => {
                const equipment = this.equipmentMaterialMap.get(equipEle);
                if (equipment) {
                    equipment.material.emissive.setHex(0);
                }
            })
            clearInterval(this.setIntervalAlarm)
            clearTimeout(this.setTimeoutAlarm)
        }
    }


    /*
    * Raycasting 用于鼠标拾取（计算鼠标在 3d 空间中的对象）
    *
    * 1.raycaster.setFromCamera(mouse, camera)——使用相机和鼠标位置更新拾取射线
    *   param1：在标准化设备坐标 (NDC) 中——X 和 Y 分量,mouse的x,y是以屏幕中点为原点的坐标系，x和y的值在-1到1之间; param2:光线应该来自的相机
    *
    * 2.raycaster.intersectObject(equipment, true)——计算与拾取射线相交的对象
    *   param1: 与射线相交的对象; param2:如果为真，它还检查所有后代。否则它只检查与对象的交集。
    *   return: 检查光线和对象之间的所有交集，无论是否有后代。交叉点返回按距离排序，最近的在前。返回一个交叉点数组.
    * */
    onPointerClick = (event) => {
        const [w, h] = [window.innerWidth, window.innerHeight];
        const {mouse, equipment, raycaster} = this;
        this.mouse.x = (event.clientX / w) * 2 - 1;
        this.mouse.y = -(event.clientY / h) * 2 + 1;
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObject(equipment, true);
        if (intersects.length <= 0) {
            return false;
        }
        const selectedObject = intersects[0].object;
        if (selectedObject.isMesh) {
            this.outline([selectedObject]);
            this.nowLabelData = this.equipmentLabelData[intersects[0].object.name];
            this.updateLabal(intersects[0]);
        }
    }

    /*
         import {RenderPass, EffectComposer, OutlinePass} from "three-outlinepass";

      1. EffectComposer( renderer : WebGLRenderer, renderTarget : WebGLRenderTarget ) renderer -- 用于渲染场景的渲染器。
         用于在three.js中实现后期处理效果。该类管理了产生最终视觉效果的后期处理过程链。 后期处理过程根据它们添加/插入的顺序来执行，最后一个过程会被自动渲染到屏幕上。

      2. new RenderPass(scene, camera);
      一个RenderPass就是渲染管线的单次运行。一个RenderPass将图像渲染到内存中的帧缓冲附件中。在渲染过程开始时，每个附件需要在块状内存中初始化而且在渲染结束时可能需要写回到内存中。

    */
    outline = (selectedObjects, color = 0x15c5e8) => {
        const [w, h] = [window.innerWidth, window.innerHeight];
        let compose = new EffectComposer(this.renderer);
        let renderPass = new RenderPass(this.scene, this.camera);
        let outlinePass = new OutlinePass(
            new THREE.Vector2(w, h),
            this.scene,
            this.camera,
            selectedObjects
        );
        outlinePass.renderToScreen = true;
        outlinePass.selectedObjects = selectedObjects;
        compose.addPass(renderPass);  // 过程链先处理renderPass,渲染场景，不然除了outline高亮轮廓，否则会失去其他所有mesh
        compose.addPass(outlinePass); // 渲染完原场景，处理outline管道
        const params = {
            edgeStrength: 3,
            edgeGlow: 0,
            edgeThickness: 20,
            pulsePeriod: 1,
            usePatternTexture: false
        };
        outlinePass.edgeStrength = params.edgeStrength;
        outlinePass.edgeGlow = params.edgeGlow;
        outlinePass.visibleEdgeColor.set(color);
        outlinePass.hiddenEdgeColor.set(color);
        compose.render(this.scene, this.camera);
        this.compose = compose
    }

    /**
     * 设置相机控件
     * @param {Object} camera 相机
     */
    cameraControl = (camera) => {
        const {CSSRender} = this
        let controls = new OrbitControls(camera, CSSRender.domElement);
        // controls.minDistance = 3; //设置缩放范围
        controls.maxDistance = 20; //设置缩放范围
        controls.maxPolarAngle = Math.PI / 1.2; //设置旋转范围

    }

    /**
     * 组件挂载时，创建作为label的2D对象
     * DOM 元素被包装到 CSS2DObject 的实例中并添加到scene中
     */
    createTurbineLabel = () => {
        const label = new CSS2DObject(document.querySelector('#equipmentLabelRef'));
        // const label = new CSS2DObject(this.equipmentLabelRef);
        this.turbineLabel = label;
        this.scene.add(label);
    }

    /**
     * intersect参数是鼠标点击的部件
     * DOM 元素被包装到 CSS2DObject 的实例中并添加到scene中
     */
    updateLabal = (intersect) => {
        this.setState({
            labelShow:true
        },()=>{
            const point = intersect.point;
            this.turbineLabel.position.set(point.x-0.01, point.y+0.01, point.z-0.03);
        })

    }


    reRender = () => {
        const {scene, camera, CSSRender} = this;
        if (scene && camera) {
            this.renderer.render(scene, camera);
            CSSRender.render(scene, camera);
        }
        // 用于跟踪时间的对象
        const delta = new Clock().getDelta(); //获取自设置 oldTime 时间以来经过的秒数，并将 oldTime 设置为当前时间，在此delta基本为0
        this.compose && this.compose.render(delta);

        requestAnimationFrame(this.reRender);
        const mixerUpdateDelta = this.clock.getDelta();
        this.mixers.forEach(mixer => {
            mixer.update(mixerUpdateDelta);
        });
        // TWEEN.update();
    }

    mounted = () => {
        const {CSSRender} = this;
        CSSRender.setSize(size.w, size.h);
        CSSRender.domElement.style.position = "absolute";
        CSSRender.domElement.style.top = 0;
        this.myRef.current.appendChild(CSSRender.domElement);
        this.myRef.current.appendChild(this.renderer.domElement);
        this.reRender();

    }


    loadGui = () => {
        this.gui = new dat.GUI().addFolder('Envision 3D风机控件');

        this.controlsGui = {
            "材质": () => {
                if (this.state.showTurbineMtl) {
                    this.loadEquipment()
                } else {
                    let removeEquipment = this.scene.getObjectByName('equipment')
                    this.scene.remove(removeEquipment)
                }
                let removeTurbine = this.scene.getObjectByName('turbine')
                this.scene.remove(removeTurbine)
                let a = !this.state.showTurbineMtl
                this.setState({
                    showTurbineMtl: a
                })
                this.loadTurbine();
            },
            "天气": () => {
                if (this.scene.getObjectByName('flash')) {
                    let removeFlashObject = this.scene.getObjectByName('flash')
                    this.scene.remove(removeFlashObject)
                    cancelAnimationFrame(flashAnimatation)
                } else {
                    this.loadFlash()
                }
            },
            "仅部件": () => {
                if (this.scene.getObjectByName('turbine')) {
                    let removeTurbine = this.scene.getObjectByName('turbine')
                    this.scene.remove(removeTurbine)
                    // cancelAnimationFrame(turbineAnimataion)
                } else {
                    this.loadTurbine()
                }
            },
            "部件损坏告警": () => {
                let a = !this.state.showEquipmentAlarm
                this.setState({
                    showEquipmentAlarm: a
                }, () => {
                    this.createAlarm()
                })

            },
            "风速": (() => {
                return 5
            })(),


        };
    }


    renderSpeed = () => {
        if (!timer) {
            timer = setTimeout(() => {
                this.setState({
                    speed: this.controlsGui.风速
                });
                timer = null
            }, 1500)
        }
        requestAnimationFrame(this.renderSpeed);
    }


    render() {
        const spareLabel = {
            'cn': "无数据",
            'en': "No data",
            'list': [
                {
                    'name': "无数据",
                    'value': "",
                    'unit': "无数据"
                }
            ]
        }

        let labelShow = this.state.labelShow
        const labelData = !this.nowLabelData? spareLabel:this.nowLabelData
        return (
            <div>
                <div ref={this.myRef}>
                </div>

                <ul id={'equipmentLabelRef'} ref={this.equipmentLabelRef} className={`equipmentLabel ${!labelShow? 'hide' : ''}`}  >
                    <li onClick={()=>{this.setState({labelShow:false})}} >{}</li>
                    <li className='labelInfo' onClick={()=>{this.setState({labelShow:false})}}>
                        <div>
                            <header>
                                <div className="cn">{labelData.cn}</div>
                                <span className="en">{labelData.en}</span>
                            </header>
                            {
                                labelData.list.map((ele)=>{
                                    return (<ul>
                                                <li>
                                                    <span>{ele.name}</span>
                                                    <span>{ele.value}</span>
                                                    <span>{ele.unit}</span>
                                                </li>
                                           </ul>)

                                })
                            }

                        </div>
                    </li>
                </ul>
            </div>
        )
    }
}


