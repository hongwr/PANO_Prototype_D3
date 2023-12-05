import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as d3 from 'd3';
import xray from './xray/A- final.jpg';
import { GlobalStyle } from './styles';

interface Datum {
    linkedCircle: string;
}

let initialPoint: number[] | null = null;
let initialPolygonPoints: number[][] | null = null;
let mousedownTime: number = 0;
let mouseupTime: number = 0;
let newCircle: d3.Selection<SVGCircleElement, unknown, null, undefined> | null = null;
let initialMousePosition: number[] | null = null;
let initialCirclePosition: number[] | null = null;

function App() {
    const svgRef = React.useRef<SVGSVGElement>(null); // Create a ref for the SVG element
    const [index, setIndex] = useState(0);
    const [drawing, setDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<[number, number]>([0, 0]);
    const [coords, setCoords] = useState([]);

    window.addEventListener(
        'contextmenu',
        function (e) {
            e.preventDefault();
        },
        false
    );

    const polygonDrag = d3
        .drag<SVGPolygonElement, unknown>()
        .on('start', function (event: { x: number; y: number }) {
            const points = d3
                .select(this)
                .attr('points')
                .split(' ')
                .map((point: string) => point.split(',').map(Number));
            initialMousePosition = points[0];
            initialPolygonPoints = points;
            initialMousePosition = [event.x, event.y]; // Record the initial mouse position
        })
        .on('drag', function (event: { x: number; y: number }) {
            if (initialPolygonPoints !== null && initialMousePosition !== null) {
                const dx = event.x - initialMousePosition[0];
                const dy = event.y - initialMousePosition[1];

                const newPoints = initialPolygonPoints.map(([x, y]) => [(x + dx).toFixed(2), (y + dy).toFixed(2)].join(',')).join(' ');
                d3.select(this).attr('points', newPoints);
            }
        });

    const handleMouseDown = (e: { button: number }) => {
        if (e.button !== 2) return;
        mousedownTime = new Date().getTime();
        if (!drawing) {
            setDrawing(true);
            const point = d3.pointer(e, svgRef.current);
            setStartPoint(point);
        }
    };

    const handleMouseMove = (e) => {
        if (!drawing) return;
        const endPoint = d3.pointer(e);

        d3.select(svgRef.current).select('.temp').remove();

        d3.select(svgRef.current)
            .append('polygon')
            .attr('class', 'temp')
            .attr('points', `${startPoint[0]},${startPoint[1]} ${endPoint[0]},${startPoint[1]} ${endPoint[0]},${endPoint[1]} ${startPoint[0]},${endPoint[1]}`)
            .attr('fill', 'yellow')
            .attr('opacity', 0.25);
    };

    const handleMouseUp = (e: { button: number }) => {
        if (!drawing || e.button !== 2) return;
        mouseupTime = new Date().getTime();
        const clickSpeed = mouseupTime - mousedownTime;
        setDrawing(false);

        const endPoint = d3.pointer(e);

        d3.select(svgRef.current).select('.temp').remove();

        const newPolygon = d3
            .select(svgRef.current)
            .append('polygon')
            .attr('id', `polygon${index}`)
            .attr('points', `${startPoint[0]},${startPoint[1]} ${endPoint[0]},${startPoint[1]} ${endPoint[0]},${endPoint[1]} ${startPoint[0]},${endPoint[1]}`)
            .attr('fill', 'yellow')
            .attr('opacity', 0.25);

        if (clickSpeed < 200) {
            const polygon = d3.select(`#polygon${index}`);
            polygon.remove();
        } else {
            setIndex(index + 1);
        }

        newPolygon.call(polygonDrag);
    };

    // console.log(coords);

    return (
        <>
            <GlobalStyle />
            <Layout id='layout' onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
                {/* SVG overlay */}
                <StyledSvg ref={svgRef} />
                {/* Image */}
                <StyledImg src={xray} />
            </Layout>
        </>
    );
}

export default App;

const Layout = styled.div`
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
`;

const StyledImg = styled.img`
    width: 100%;
    height: 100%;
`;

const StyledSvg = styled.svg`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
`;

// function App() {
//   const svgRef = React.useRef<SVGSVGElement>(null); // Create a ref for the SVG element
//   const [index, setIndex] = useState(0);
//   const [drawing, setDrawing] = useState(false);
//   const [startPoint, setStartPoint] = useState([]);
//   const [coords, setCoords] = useState([]);

//   window.addEventListener('contextmenu', function (e) {
//     e.preventDefault();
//   }, false);

//   const drag = d3.drag()
//     .filter(function() {
//       return this.id.startsWith('circle');
//     })
//     .on("start", function (event: { sourceEvent: { stopPropagation: () => void; }; }) {
//       event.sourceEvent.stopPropagation();
//       initialPoint = [parseFloat(d3.select(this).attr('cx')), parseFloat(d3.select(this).attr('cy'))]; // Use the circle's initial position
//       const linkedPolygon = d3.select(`#polygon${d3.select(this).attr('id').slice(6)}`);
//       initialPolygonPoints = linkedPolygon.attr('points').split(' ').map((point: string) => point.split(',').map(Number));
//     })
//     .on("drag", function (event: { x: number; y: number; }) {
//       if(initialPoint !== null && initialPolygonPoints !== null) {
//         const dx = event.x - initialPoint[0];
//         const dy = event.y - initialPoint[1];

//         d3.select(this)
//           .attr("cx", initialPoint[0] + dx)
//           .attr("cy", initialPoint[1] + dy);
//         const linkedPolygon = d3.select(`#polygon${d3.select(this).attr('id').slice(6)}`);
//         const newPoints = initialPolygonPoints.map(([x, y]) => [(x + dx).toFixed(2), (y + dy).toFixed(2)].join(',')).join(' ');
//         linkedPolygon.attr('points', newPoints);
//       }
//     });

//   const handleMouseDown = (e: { button: number; }) => {
//     if (e.button !== 2) return;
//     mousedownTime = new Date().getTime();
//     if (!drawing) {
//       // e.stopPropagation();
//       setDrawing(true);
//       const point = d3.pointer(e, svgRef.current); // Use the SVG's coordinate system
//       setStartPoint(point);

//       newCircle = d3.select(svgRef.current)
//         .append('circle')
//         .attr('id', `circle${index}`)
//         .attr('cx', point[0])
//         .attr('cy', point[1])
//         .attr('r', 6)
//         .attr('fill', 'yellow');

//         if (newCircle !== null) {
//           newCircle.call(drag);
//         }
//     }
//   }

//   const handleMouseMove = (e) => {
//     if (!drawing) return;
//     const endPoint = d3.pointer(e);

//     // Remove the old temporary polygon
//     d3.select(svgRef.current).select('.temp').remove();

//     // Draw a new temporary polygon
//     d3.select(svgRef.current)
//       .append('polygon')
//       .attr('class', 'temp')
//       .attr('points', `${startPoint[0]},${startPoint[1]} ${endPoint[0]},${startPoint[1]} ${endPoint[0]},${endPoint[1]} ${startPoint[0]},${endPoint[1]}`)
//       .attr('fill', 'yellow')
//       .attr('opacity', 0.25);
//   }

//   const handleMouseUp = (e: { button: number; }) => {
//     if (!drawing || e.button !== 2) return;
//     mouseupTime = new Date().getTime();
//     const clickSpeed = mouseupTime - mousedownTime;
//     console.log(clickSpeed, mouseupTime, mousedownTime)
//     setDrawing(false);

//     const endPoint = d3.pointer(e); // Use the SVG's coordinate system

//     // Remove the old temporary polygon
//     d3.select(svgRef.current).select('.temp').remove();

//     // Draw a new permanent polygon
//     const newPolygon = d3.select(svgRef.current)
//     .append('polygon')
//     .attr('id', `polygon${index}`)
//     .attr('points', `${startPoint[0]},${startPoint[1]} ${endPoint[0]},${startPoint[1]} ${endPoint[0]},${endPoint[1]} ${startPoint[0]},${endPoint[1]}`)
//     .attr('fill', 'yellow')
//     .attr('opacity', 0.25)

//     newPolygon.datum({ linkedCircle: `circle${index}` });

//     d3.select(`#circle${index}`).raise();
//     console.log(d3.select(`#polygon${newCircle.attr('id').slice(6)}`));

//     if (clickSpeed < 200 && newCircle) { // 1000 is the click speed threshold
//       newCircle.remove();
//       const linkedPolygon = d3.select(`#polygon${newCircle.attr('id').slice(6)}`);
//       linkedPolygon.remove();
//     } else {
//       setIndex(index + 1);
//     }
//   }

// // console.log(coords);

//   return (
//     <>
//       <GlobalStyle />
//       <Layout id="layout"
//       onMouseDown={handleMouseDown}
//       onMouseMove={handleMouseMove}
//       onMouseUp={handleMouseUp}
//       >
//         {/* SVG overlay */}
//         <StyledSvg ref={svgRef} />
//         {/* Image */}
//         <StyledImg src={xray} />
//       </Layout>
//     </>
//   );
// }

// export default App;
