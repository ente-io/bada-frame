import React from 'react';
import styled from 'styled-components';

const Rotate = styled.div<{ disabled }>`
    width: 24px;
    height: 27px;
    ${(props) => !props.disabled && '-webkit-animation: rotation 1s infinite linear'};
    cursor:${(props) => props.disabled && 'pointer'};
    transition-duration: 0.8s;
    transition-property: transform;
    &:hover {
        color:#fff;
        transform: rotate(90deg);
        -webkit-transform: rotate(90deg);
    }

`;
export default function InProgressIcon(props) {
    return (
        <Rotate disabled={props.disabled} >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height={props.height}
                viewBox={props.viewBox}
                width={props.width}
                fill="#000000">
                <path d="M.01 0h24v24h-24V0z" fill="none" /><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
            </svg>
        </ Rotate>
    );
}
InProgressIcon.defaultProps = {
    disabled: false,
    height: 24,
    width: 24,
    viewBox: '0 0 24 24',
};

