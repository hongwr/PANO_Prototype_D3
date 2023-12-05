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
    const oldWidth = useRef(0);
    const oldHeight = useRef(0);

    const svgRef = React.useRef<SVGSVGElement>(null); // Create a ref for the SVG element
    const [index, setIndex] = useState<number>(0);
    const [drawing, setDrawing] = useState<boolean>(false);
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
            initialMousePosition = [event.x, event.y]; // Record the initial mouse position
            initialPolygonPoints = d3
                .select(this)
                .attr('points')
                .split(' ')
                .map((point: string) => point.split(',').map(Number));
        })
        .on('drag', function (event: { x: number; y: number }) {
            if (initialPolygonPoints !== null && initialMousePosition !== null) {
                const dx = event.x - initialMousePosition[0];
                const dy = event.y - initialMousePosition[1];

                const newPoints = initialPolygonPoints.map(([x, y]) => [(x + dx).toFixed(2), (y + dy).toFixed(2)].join(',')).join(' ');
                d3.select(this).attr('points', newPoints);

                const polygonId = d3.select(this).attr('id');
                d3.selectAll(`circle[linked-polygon=${polygonId}]`).each(function () {
                    const cx = Number(d3.select(this).attr('cx'));
                    const cy = Number(d3.select(this).attr('cy'));
                    d3.select(this)
                        .attr('cx', (cx + dx).toFixed(2))
                        .attr('cy', (cy + dy).toFixed(2));
                });

                initialMousePosition = [event.x, event.y];
                initialPolygonPoints = newPoints.split(' ').map((point: string) => point.split(',').map(Number));
            }
        });

    const circleDrag = d3
        .drag<SVGCircleElement, unknown>()
        .on('start', function (event: { x: number; y: number }) {
            const circleX = Number(d3.select(this).attr('cx'));
            const circleY = Number(d3.select(this).attr('cy'));
            initialCirclePosition = [circleX, circleY];
            initialMousePosition = [event.x, event.y];
        })
        .on('drag', function (event: { x: number; y: number }) {
            if (initialCirclePosition !== null && initialMousePosition !== null) {
                const dx = event.x - initialMousePosition[0];
                const dy = event.y - initialMousePosition[1];
                const newCx = initialCirclePosition[0] + dx;
                const newCy = initialCirclePosition[1] + dy;

                d3.select(this).attr('cx', newCx).attr('cy', newCy);

                const polygonId = d3.select(this).attr('linked-polygon');
                const pointIndex = Number(d3.select(this).attr('point-index'));
                const polygon = d3.select(`#${polygonId}`);
                const points = polygon
                    .attr('points')
                    .split(' ')
                    .map((point: string) => point.split(',').map(Number));
                const newPoints = points
                    .map(([x, y], index) => {
                        if (index === pointIndex) {
                            return [newCx.toFixed(2), newCy.toFixed(2)].join(',');
                        } else if (index === (pointIndex + 3) % 4 && dx !== 0 && (pointIndex === 0 || pointIndex === 2)) {
                            return [(x + dx).toFixed(2), y.toFixed(2)].join(',');
                        } else if (index === (pointIndex + 1) % 4 && dy !== 0 && (pointIndex === 0 || pointIndex === 2)) {
                            return [x.toFixed(2), (y + dy).toFixed(2)].join(',');
                        } else if (index === (pointIndex + 1) % 4 && dx !== 0 && (pointIndex === 1 || pointIndex === 3)) {
                            return [(x + dx).toFixed(2), y.toFixed(2)].join(',');
                        } else if (index === (pointIndex + 3) % 4 && dy !== 0 && (pointIndex === 1 || pointIndex === 3)) {
                            return [x.toFixed(2), (y + dy).toFixed(2)].join(',');
                        } else {
                            return [x.toFixed(2), y.toFixed(2)].join(',');
                        }
                    })
                    .join(' ');
                polygon.attr('points', newPoints);

                points.forEach((point, i) => {
                    const [cx, cy] = point;
                    d3.select(`circle[linked-polygon=${polygonId}][point-index='${i}']`).attr('cx', cx).attr('cy', cy);
                });

                initialMousePosition = [event.x, event.y];
                initialCirclePosition = [newCx, newCy];
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
        const polygonPoints = `${startPoint[0]},${startPoint[1]} ${endPoint[0]},${startPoint[1]} ${endPoint[0]},${endPoint[1]} ${startPoint[0]},${endPoint[1]}`;
        const newPolygon = d3.select(svgRef.current).append('polygon').attr('id', `polygon${index}`).attr('points', polygonPoints).attr('fill', 'yellow').attr('opacity', 0.25);

        const points = polygonPoints.split(' ');
        points.forEach((point, i) => {
            const [cx, cy] = point.split(',');
            d3.select(svgRef.current)
                .append('circle')
                .attr('cx', cx)
                .attr('cy', cy)
                .attr('r', 6)
                .attr('fill', 'blue')
                .attr('linked-polygon', `polygon${index}`)
                .attr('point-index', i)
                .call(circleDrag);
        });

        if (clickSpeed < 200) {
            const polygon = d3.select(`#polygon${index}`);
            const circles = d3.selectAll(`circle[linked-polygon=polygon${index}]`);
            polygon.remove();
            circles.remove();
        } else {
            setIndex(index + 1);
        }

        newPolygon.call(polygonDrag);
    };

    useEffect(() => {
        const layoutElement = document.getElementById('layout');
        if (layoutElement) {
            oldWidth.current = layoutElement.offsetWidth;
            oldHeight.current = layoutElement.offsetHeight;

            const resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(layoutElement);

            return () => {
                resizeObserver.unobserve(layoutElement);
            };
        }
    }, []);

    function handleResize(entries: any) {
        console.log(entries);
        for (let entry of entries) {
            const newWidth = entry.contentRect.width;
            const newHeight = entry.contentRect.height;

            const widthRatio = newWidth / oldWidth.current;
            const heightRatio = newHeight / oldHeight.current;

            d3.selectAll('circle').each(function () {
                const circle = d3.select(this);
                const oldCx = parseFloat(circle.attr('cx'));
                const oldCy = parseFloat(circle.attr('cy'));
                const newCx = oldCx * widthRatio;
                const newCy = oldCy * heightRatio;
                circle.attr('cx', newCx.toFixed(2));
                circle.attr('cy', newCy.toFixed(2));
            });

            d3.selectAll('polygon').each(function () {
                const polygon = d3.select(this);
                const oldPoints = polygon
                    .attr('points')
                    .split(' ')
                    .map((point) => point.split(',').map(Number));
                const newPoints = oldPoints.map(([x, y]) => [Number(x * widthRatio).toFixed(2), Number(y * heightRatio).toFixed(2)]);
                polygon.attr('points', newPoints.join(' '));
            });

            oldWidth.current = newWidth;
            oldHeight.current = newHeight;
        }
    }

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
