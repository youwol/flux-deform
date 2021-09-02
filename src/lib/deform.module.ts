import { DataFrame } from '@youwol/dataframe'
import {
    Context, BuilderView, Flux, Property, Schema, ModuleFlux, Pipe, freeContract
} from '@youwol/flux-core'

import { DeformParameters, deform } from './deform'
import { pack } from './main'
import { createSurface, SurfaceParameters } from '@youwol/kepler'


export namespace DeformSurface {

    let svgIcon = `<g transform="translate(0.000000,500.000000) scale(0.100000,-0.100000)"
    fill="#000000" stroke="none">
    <path d="M1095 4066 c-37 -16 -70 -52 -84 -89 -7 -18 -11 -161 -11 -402 l0
    -373 73 -16 c251 -57 536 -90 739 -84 l118 3 -61 75 c-220 268 -322 514 -323
    778 l-1 122 -210 0 c-153 -1 -218 -4 -240 -14z"/>
    <path d="M1724 4054 c-13 -51 3 -246 26 -319 30 -94 88 -214 148 -305 37 -55
    183 -240 236 -297 5 -6 165 40 225 64 35 14 94 43 132 64 177 101 382 153 655
    167 l124 7 -55 113 c-74 154 -198 339 -338 505 l-23 27 -562 0 -562 0 -6 -26z"/>
    <path d="M3149 3988 c125 -170 202 -303 271 -473 l37 -90 89 -7 c49 -4 154
    -17 234 -29 80 -11 162 -23 183 -26 l37 -6 0 299 c0 280 -1 300 -21 340 -15
    31 -32 48 -63 63 -41 20 -59 21 -439 21 l-397 0 69 -92z"/>
    <path d="M3060 3249 c-204 -19 -300 -47 -515 -154 -82 -41 -186 -85 -230 -97
    -44 -12 -82 -23 -84 -24 -1 -2 9 -39 24 -83 40 -121 54 -220 55 -378 0 -169
    -19 -317 -64 -497 -19 -72 -32 -133 -29 -136 2 -2 176 -6 387 -8 l384 -4 6 53
    c3 30 10 112 16 184 28 318 89 529 215 740 83 139 97 185 93 311 l-3 99 -80 1
    c-44 1 -123 -2 -175 -7z"/>
    <path d="M3495 3138 c-1 -140 -23 -219 -95 -338 -29 -47 -63 -107 -76 -133
    -79 -154 -133 -399 -150 -676 l-7 -113 44 6 c24 3 89 11 144 17 219 23 451 81
    578 145 l67 34 0 549 0 549 -67 12 c-79 13 -303 46 -383 55 l-55 6 0 -113z"/>
    <path d="M1000 2512 l0 -510 78 -11 c275 -40 942 -105 953 -93 4 4 18 50 32
    102 102 374 101 689 -4 913 -12 27 -16 28 -52 23 -73 -12 -431 -6 -557 9 -104
    12 -302 45 -422 71 l-28 6 0 -510z"/>
    <path d="M3910 1848 c-147 -58 -418 -113 -657 -134 l-83 -7 1 -111 c1 -61 6
    -169 13 -241 l11 -130 343 -3 c327 -2 344 -1 382 18 26 13 47 34 60 60 19 36
    20 58 20 310 0 148 -3 270 -7 269 -5 0 -42 -14 -83 -31z"/>
    <path d="M1000 1583 c0 -219 2 -240 21 -279 15 -31 32 -48 63 -64 41 -19 57
    -20 352 -18 l309 3 61 121 c33 66 84 176 113 244 58 138 58 140 -22 140 -59 0
    -488 43 -697 70 -85 11 -165 20 -177 20 l-23 0 0 -237z"/>
    <path d="M2116 1613 c-21 -54 -69 -164 -107 -245 l-68 -148 541 0 540 0 -6 53
    c-5 44 -25 360 -26 407 0 13 -40 15 -293 16 -160 0 -348 4 -418 8 l-125 7 -38
    -98z"/></g>`



    @Schema({
        pack
    })
    export class PersistentData {
        /**
         *  access to the scaling in x, y and Z
         */
        @Property({
            description: "scale in X"
        })
        xScale: number = 1

        @Property({
            description: "scale in Y"
        })
        yScale: number = 1

        @Property({
            description: "scale in z"
        })
        zScale: number = 1

        constructor({ xScale = 1, yScale = 1, zScale = 1 }: {
            xScale?: number,
            yScale?: number,
            zScale?: number
        } = {}) {
            Object.assign(this, { xScale, yScale, zScale })
        }
    }

    @Flux({
        pack: pack,
        namespace: DeformSurface,
        id: "deformSurface",
        displayName: "deform surface",
        description: "deform 3D surfaces for a given displacement field ",
        resources: {
            'technical doc': `${pack.urlCDN}/dist/docs/modules/lib_deform_surface.deform_surface.html`
        }
    })
    @BuilderView({
        namespace: DeformSurface,
        icon: svgIcon
    })
    export class Module extends ModuleFlux {

        /**
         * This is the output, you can use it to emit messages using *this.result$.next(...)*.
         *
         */
        result$: Pipe<any>

        constructor(params) {
            super(params)

            this.addInput({
                id: 'input',
                description: 'trigger deformation',
                contract: freeContract(),
                onTriggered: ({ data, configuration, context }) => this.deformSurface(data, configuration, context)
            })
            this.result$ = this.addOutput({ id: 'result' })
        }
        deformSurface(data: any, configuration: PersistentData, context: Context) {
            const pm = new DeformParameters({
                scaleX: configuration.xScale,
                scaleY: configuration.yScale,
                scaleZ: configuration.zScale
            })
            
            let deformedSerie = deform({
                geometry: data.children[0].geometry,
                deformVector: data.children[0].dataframe.series['U'],
                parameters: pm
            })
 
            let deformedSurface = createSurface({
                positions: deformedSerie.array,
                indices: data.children[0].geometry.index.array,
                parameters: new SurfaceParameters({
                    color: '#ff0000',
                    flat: true,
                    opacity: 0.7, 
                    creaseAngle: 30 // in degrees
                })
            })

            this.result$.next({ data: deformedSurface, context })
            context.terminate()
        }
    }
}