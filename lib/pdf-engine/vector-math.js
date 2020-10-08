function transformVector(inVector,inMatrix) 
{
	
    if(!inMatrix)
        return inVector
	
    return [inMatrix[0]*inVector[0] + inMatrix[2]*inVector[1] + inMatrix[4],
        inMatrix[1]*inVector[0] + inMatrix[3]*inVector[1] + inMatrix[5]]
}	

function transformBox(inBox,inMatrix)
{
    if(!inMatrix)
        return inBox
    
    var t = new Array(4)
    t[0] = transformVector([inBox[0],inBox[1]],inMatrix)
    t[1] = transformVector([inBox[0],inBox[3]],inMatrix)
    t[2] = transformVector([inBox[2],inBox[3]],inMatrix)
    t[3] = transformVector([inBox[2],inBox[1]],inMatrix)
    
    var minX,minY,maxX,maxY
    
    minX = maxX = t[0][0]
    minY = maxY = t[0][1]
    
    for(var i=1;i<4;++i)
    {
        if(minX > t[i][0])
            minX = t[i][0]
        if(maxX < t[i][0])
            maxX = t[i][0]
        if(minY > t[i][1])
            minY = t[i][1]
        if(maxY < t[i][1])
            maxY = t[i][1]
    }
    
    return [minX,minY,maxX,maxY]
}

module.exports = {
    transformBox,
    transformVector
}